import {
  collectionDefinitions,
  hackathonTrackDefinitions,
  manualProjectBadges,
} from "@/data/social";
import { projectTips } from "@/data/tips";
import { db } from "@/server/db/client";
import { projects as projectsTable, tips as tipsTable } from "@/server/db/schema";
import type { Project, ProjectTip } from "@/types/project";
import type {
  EcosystemActivityItem,
  ProjectClaimStatus,
  ProjectCollection,
  ProjectSocialBadge,
  ProjectSocialSignal,
  ProjectShoutout,
  SignalScoreBreakdown,
  SocialLayerData,
} from "@/types/social";
import { desc, eq, ne } from "drizzle-orm";

export async function getSocialLayerData(
  projects: Project[],
): Promise<SocialLayerData> {
  const tips = await getTipRows();
  const collections = buildCollections(projects);
  const collectionIdsByProject = getCollectionIdsByProject(collections);
  const signals = buildProjectSocialSignals({
    collectionIdsByProject,
    projects,
    tips,
  });
  const activityFeed = buildActivityFeed(projects, tips, signals);
  const hackathonTracks = buildHackathonTracks(projects);

  return {
    activityFeed,
    collections,
    hackathonTracks,
    projects: signals,
    stats: {
      claimReadyProfiles: signals.filter(
        (signal) => signal.claimStatus === "claim-ready",
      ).length,
      collectionCount: collections.length,
      shoutoutCount: signals.reduce(
        (total, signal) => total + signal.shoutouts.length,
        0,
      ),
      verifiedBuilders: signals.filter(
        (signal) => signal.claimStatus === "verified",
      ).length,
    },
  };
}

async function getTipRows(): Promise<ProjectTip[]> {
  if (!db) {
    return projectTips;
  }

  try {
    const rows = await db
      .select({
        amountUsdcMicro: tipsTable.amountUsdcMicro,
        createdAt: tipsTable.createdAt,
        id: tipsTable.id,
        message: tipsTable.message,
        projectSlug: projectsTable.slug,
        tipperAddress: tipsTable.tipperAddress,
        transactionHash: tipsTable.transactionHash,
      })
      .from(tipsTable)
      .innerJoin(projectsTable, eq(tipsTable.projectId, projectsTable.id))
      .where(ne(projectsTable.status, "archived"))
      .orderBy(desc(tipsTable.createdAt));

    if (rows.length === 0) {
      return projectTips;
    }

    return rows.map((row) => ({
      amountUsdc: Number(row.amountUsdcMicro) / 1_000_000,
      id: row.id,
      message: row.message ?? "Supported this project on Arc Testnet.",
      projectSlug: row.projectSlug,
      timestamp: row.createdAt.toISOString().slice(0, 10),
      tipperAddress: row.tipperAddress as `0x${string}`,
      transactionHash: row.transactionHash as `0x${string}`,
    }));
  } catch {
    return projectTips;
  }
}

function buildProjectSocialSignals({
  collectionIdsByProject,
  projects,
  tips,
}: {
  collectionIdsByProject: Map<string, string[]>;
  projects: Project[];
  tips: ProjectTip[];
}): ProjectSocialSignal[] {
  const maxTips = Math.max(
    ...projects.map((project) => project.metrics.tipsUsdc),
    1,
  );
  const maxWeeklyTips = Math.max(
    ...projects.map((project) => project.metrics.weeklyTipsUsdc),
    1,
  );

  return projects
    .map((project) => {
      const projectTipRows = tips
        .filter((tip) => tip.projectSlug === project.slug)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const score = buildSignalScore(project, projectTipRows, {
        maxTips,
        maxWeeklyTips,
      });
      const badges = buildProjectBadges(project, score, projectTipRows);

      return {
        badges,
        claimStatus: getClaimStatus(project, badges),
        collections: collectionIdsByProject.get(project.slug) ?? [],
        project,
        score,
        shoutouts: projectTipRows.slice(0, 5).map(mapTipToShoutout),
      };
    })
    .sort((a, b) => b.score.total - a.score.total);
}

function buildSignalScore(
  project: Project,
  tips: ProjectTip[],
  maximums: {
    maxTips: number;
    maxWeeklyTips: number;
  },
): SignalScoreBreakdown {
  const socialWeight = getSocialLinkWeight(project);
  const freshestSignal = getFreshestSignalDate(project, tips);
  const daysSinceFreshestSignal = Math.max(
    0,
    (Date.now() - freshestSignal.getTime()) / (24 * 60 * 60 * 1_000),
  );
  const tip = normalize(project.metrics.tipsUsdc, maximums.maxTips, 35);
  const velocity = normalize(
    project.metrics.weeklyTipsUsdc,
    maximums.maxWeeklyTips,
    25,
  );
  const freshness = clamp(Math.round(15 - daysSinceFreshestSignal * 2), 4, 15);
  const social = clamp(socialWeight, 2, 15);
  const curation = clamp(
    4 +
      (project.featured ? 3 : 0) +
      (project.profile.curationNotes.length >= 2 ? 2 : 0) +
      (project.status === "testnet" ? 1 : 0),
    4,
    10,
  );

  return {
    curation,
    freshness,
    social,
    tip,
    total: clamp(tip + velocity + freshness + social + curation, 1, 100),
    velocity,
  };
}

function buildProjectBadges(
  project: Project,
  score: SignalScoreBreakdown,
  tips: ProjectTip[],
): ProjectSocialBadge[] {
  const badges: ProjectSocialBadge[] = [];
  const manualBadges =
    manualProjectBadges[project.slug as keyof typeof manualProjectBadges] ?? [];

  badges.push(...manualBadges);

  if (project.featured && project.links.length > 0) {
    badges.push({
      description: "ArcRadar has enough public proof links to mark this builder.",
      label: "Verified Builder",
      tone: "forest",
    });
  } else if (project.walletAddress) {
    badges.push({
      description: "Project has a tip wallet and is ready for future claim flow.",
      label: "Claim Ready",
      tone: "ink",
    });
  }

  if (score.velocity >= 20 || project.metrics.weeklyTipsUsdc >= 15) {
    badges.push({
      description: "Weekly USDC support is moving faster than the rest of the map.",
      label: "Rising Signal",
      tone: "mint",
    });
  }

  if (tips.length >= 2) {
    badges.push({
      description: "Supporters are leaving useful public messages with their tips.",
      label: "Message Wall",
      tone: "blueprint",
    });
  }

  if (
    project.stage === "Prototype" ||
    project.stage === "Community" ||
    project.tags.some((tag) => ["Deploy", "Tooling", "Events"].includes(tag))
  ) {
    badges.push({
      description: "Good candidate for a focused Arc hackathon sprint.",
      label: "Hackathon Fit",
      tone: "amber",
    });
  }

  return dedupeBadges(badges).slice(0, 5);
}

function buildCollections(projects: Project[]): ProjectCollection[] {
  return collectionDefinitions
    .map(({ categories, tags, ...definition }) => ({
      ...definition,
      projectSlugs: projects
        .filter((project) => matchesProject(project, { categories, tags }))
        .map((project) => project.slug),
    }))
    .filter((collection) => collection.projectSlugs.length > 0);
}

function buildHackathonTracks(projects: Project[]) {
  return hackathonTrackDefinitions
    .map(({ categories, tags, ...definition }) => ({
      ...definition,
      projectSlugs: projects
        .filter((project) => matchesProject(project, { categories, tags }))
        .slice(0, 4)
        .map((project) => project.slug),
    }))
    .filter((track) => track.projectSlugs.length > 0);
}

function buildActivityFeed(
  projects: Project[],
  tips: ProjectTip[],
  signals: ProjectSocialSignal[],
): EcosystemActivityItem[] {
  const projectsBySlug = new Map(
    projects.map((project) => [project.slug, project]),
  );
  const tipItems = tips.slice(0, 8).flatMap((tip): EcosystemActivityItem[] => {
    const project = projectsBySlug.get(tip.projectSlug);

    if (!project) {
      return [];
    }

    return [
      {
        amountUsdc: tip.amountUsdc,
        href: `/projects/${project.slug}`,
        id: `tip-${tip.transactionHash}`,
        message: tip.message,
        projectName: project.name,
        projectSlug: project.slug,
        timestamp: tip.timestamp,
        type: "tip",
        walletAddress: tip.tipperAddress,
      },
    ];
  });
  const socialItems = signals.slice(0, 4).map((signal) => ({
    href: `/projects/${signal.project.slug}`,
    id: `signal-${signal.project.slug}`,
    message: `${signal.badges[0]?.label ?? "Signal"} badge active with score ${
      signal.score.total
    }.`,
    projectName: signal.project.name,
    projectSlug: signal.project.slug,
    timestamp: getFreshestSignalDate(signal.project, signal.shoutouts).toISOString().slice(
      0,
      10,
    ),
    type: signal.claimStatus === "verified" ? "claim" : "curation",
  })) satisfies EcosystemActivityItem[];

  return [...tipItems, ...socialItems]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);
}

function getCollectionIdsByProject(collections: ProjectCollection[]) {
  const map = new Map<string, string[]>();

  for (const collection of collections) {
    for (const slug of collection.projectSlugs) {
      const current = map.get(slug) ?? [];
      current.push(collection.id);
      map.set(slug, current);
    }
  }

  return map;
}

function getClaimStatus(
  project: Project,
  badges: ProjectSocialBadge[],
): ProjectClaimStatus {
  if (badges.some((badge) => badge.label === "Verified Builder")) {
    return "verified";
  }

  if (project.walletAddress) {
    return "claim-ready";
  }

  return "unclaimed";
}

function getSocialLinkWeight(project: Project) {
  const labels = new Set(project.links.map((link) => link.label));

  return (
    project.links.length * 3 +
    (labels.has("Website") ? 3 : 0) +
    (labels.has("GitHub") ? 3 : 0) +
    (labels.has("Docs") ? 2 : 0) +
    (labels.has("X") ? 2 : 0)
  );
}

function getFreshestSignalDate(
  project: Pick<Project, "activity">,
  tips: Array<Pick<ProjectTip, "timestamp">>,
) {
  const timestamps = [
    ...project.activity.map((activity) => activity.timestamp),
    ...tips.map((tip) => tip.timestamp),
  ].filter(Boolean);
  const latest = timestamps.sort((a, b) => b.localeCompare(a))[0];

  return latest ? new Date(latest) : new Date();
}

function matchesProject(
  project: Project,
  criteria: {
    categories?: Project["category"][];
    tags?: string[];
  },
) {
  const categoryMatch =
    !criteria.categories || criteria.categories.includes(project.category);
  const tagMatch =
    !criteria.tags ||
    criteria.tags.some((tag) => project.tags.includes(tag));

  return categoryMatch || tagMatch;
}

function mapTipToShoutout(tip: ProjectTip): ProjectShoutout {
  return {
    amountUsdc: tip.amountUsdc,
    id: tip.id,
    message: tip.message,
    timestamp: tip.timestamp,
    tipperAddress: tip.tipperAddress,
    transactionHash: tip.transactionHash,
  };
}

function dedupeBadges(badges: readonly ProjectSocialBadge[]) {
  const seen = new Set<string>();

  return badges.filter((badge) => {
    if (seen.has(badge.label)) {
      return false;
    }

    seen.add(badge.label);
    return true;
  });
}

function normalize(value: number, max: number, weight: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.round((value / max) * weight);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
