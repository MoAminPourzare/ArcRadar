import { hackathonTrackDefinitions } from "@/data/social";
import { db } from "@/server/db/client";
import { projects as projectsTable, tips as tipsTable } from "@/server/db/schema";
import type { Project, ProjectTip } from "@/types/project";
import type {
  EcosystemActivityItem,
  ProjectSocialSignal,
  ProjectTipMessage,
  SignalScoreBreakdown,
  SocialLayerData,
} from "@/types/social";
import { desc, eq, isNotNull } from "drizzle-orm";

export async function getSocialLayerData(
  projects: Project[],
): Promise<SocialLayerData> {
  const tips = await getTipRows();
  const signals = buildProjectSocialSignals({
    projects,
    tips,
  });
  const activityFeed = buildActivityFeed(projects, tips, signals);
  const hackathonTracks = buildHackathonTracks(projects);

  return {
    activityFeed,
    hackathonTracks,
    projects: signals,
    stats: {
      tipMessageCount: signals.reduce(
        (total, signal) => total + signal.tipMessages.length,
        0,
      ),
    },
  };
}

async function getTipRows(): Promise<ProjectTip[]> {
  if (!db) {
    return [];
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
      .where(isNotNull(tipsTable.blockNumber))
      .orderBy(desc(tipsTable.createdAt));

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
    return [];
  }
}

function buildProjectSocialSignals({
  projects,
  tips,
}: {
  projects: Project[];
  tips: ProjectTip[];
}): ProjectSocialSignal[] {
  const weekCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);
  const tipTotalsByProject = new Map<string, { total: number; weekly: number }>();

  for (const tip of tips) {
    const current = tipTotalsByProject.get(tip.projectSlug) ?? {
      total: 0,
      weekly: 0,
    };

    current.total += tip.amountUsdc;

    if (new Date(tip.timestamp) >= weekCutoff) {
      current.weekly += tip.amountUsdc;
    }

    tipTotalsByProject.set(tip.projectSlug, current);
  }

  const maxTips = Math.max(
    ...projects.map(
      (project) => tipTotalsByProject.get(project.slug)?.total ?? 0,
    ),
    1,
  );
  const maxWeeklyTips = Math.max(
    ...projects.map(
      (project) => tipTotalsByProject.get(project.slug)?.weekly ?? 0,
    ),
    1,
  );

  return projects
    .map((project) => {
      const projectTipRows = tips
        .filter((tip) => tip.projectSlug === project.slug)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const tipTotals = tipTotalsByProject.get(project.slug) ?? {
        total: 0,
        weekly: 0,
      };
      const score = buildSignalScore(project, tipTotals, {
        maxTips,
        maxWeeklyTips,
      });
      return {
        project,
        score,
        tipMessages: projectTipRows.slice(0, 5).map(mapTipToMessage),
      };
    })
    .sort((a, b) => b.score.total - a.score.total);
}

function buildSignalScore(
  project: Project,
  tipTotals: {
    total: number;
    weekly: number;
  },
  maximums: {
    maxTips: number;
    maxWeeklyTips: number;
  },
): SignalScoreBreakdown {
  const tip = normalize(tipTotals.total, maximums.maxTips, 35);
  const velocity = normalize(
    tipTotals.weekly,
    maximums.maxWeeklyTips,
    25,
  );
  const social = clamp(getSocialLinkWeight(project), 0, 15);
  const curation = getProfileQualityScore(project);

  return {
    curation,
    social,
    tip,
    total: clamp(tip + velocity + social + curation, 0, 100),
    velocity,
  };
}

function getProfileQualityScore(project: Project) {
  let score = 0;

  if (project.profile.problem.trim().length >= 80) score += 5;
  if (project.profile.solution.trim().length >= 80) score += 5;
  if (project.profile.whyArc.trim().length >= 80) score += 5;
  if (project.description.trim().length >= 100) score += 4;
  if (project.tagline.trim().length >= 24) score += 2;
  if (project.tags.length >= 3) score += 2;
  if (project.builder.trim().length >= 3) score += 2;

  return clamp(score, 0, 25);
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
    message: `Automatic signal score: ${signal.score.total}.`,
    projectName: signal.project.name,
    projectSlug: signal.project.slug,
    timestamp: getFreshestSignalDate(signal.project, signal.tipMessages)
      .toISOString()
      .slice(0, 10),
    type: "curation",
  })) satisfies EcosystemActivityItem[];

  return [...tipItems, ...socialItems]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);
}

function getSocialLinkWeight(project: Project) {
  const labels = new Set(project.links.map((link) => link.label));

  return (
    (labels.has("Website") ? 3 : 0) +
    (labels.has("Project X") ? 3 : 0) +
    (labels.has("Builder X") ? 2 : 0) +
    (labels.has("Discord") ? 2 : 0) +
    (labels.has("GitHub") ? 5 : 0)
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

function mapTipToMessage(tip: ProjectTip): ProjectTipMessage {
  return {
    amountUsdc: tip.amountUsdc,
    id: tip.id,
    message: tip.message,
    timestamp: tip.timestamp,
    tipperAddress: tip.tipperAddress,
    transactionHash: tip.transactionHash,
  };
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
