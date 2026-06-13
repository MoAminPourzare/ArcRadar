import { projects } from "@/data/projects";
import { db } from "@/server/db/client";
import { projects as projectsTable, tips as tipsTable } from "@/server/db/schema";
import type {
  Project,
  ProjectCategory,
  ProjectLink,
  ProjectProfile,
  ProjectTip,
  ProjectTipData,
  ProjectTipperRank,
} from "@/types/project";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

export type ProjectFilters = {
  category?: ProjectCategory;
  featured?: boolean;
};

export async function getProjects(filters: ProjectFilters = {}) {
  const databaseProjects = await getDatabaseProjects();
  let result = databaseProjects ?? [...projects];

  if (filters.category) {
    result = result.filter((project) => project.category === filters.category);
  }

  if (typeof filters.featured === "boolean") {
    result = result.filter(
      (project) => Boolean(project.featured) === filters.featured,
    );
  }

  return result.sort((a, b) => a.metrics.rank - b.metrics.rank);
}

export async function getProjectBySlug(slug: string) {
  if (db) {
    try {
      const [project] = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.slug, slug))
        .limit(1);

      if (project) {
        return mapDatabaseProject(project);
      }
    } catch {
      return projects.find((project) => project.slug === slug) ?? null;
    }
  }

  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getProjectSlugs() {
  const databaseProjects = await getDatabaseProjects();

  return (databaseProjects ?? projects).map((project) => project.slug);
}

export async function getRelatedProjects(project: Project, limit = 3) {
  const projectList = (await getDatabaseProjects()) ?? projects;

  return getRelatedProjectsFromList(project, projectList, limit);
}

export function getRelatedProjectsFromList(
  project: Project,
  projectList: Project[],
  limit = 3,
) {
  return projectList
    .filter((candidate) => candidate.id !== project.id)
    .map((candidate) => ({
      project: candidate,
      score: getRelatednessScore(project, candidate),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((candidate) => candidate.project);
}

export async function getProjectStats(projectList = projects) {
  return {
    totalProjects: projectList.length,
    totalTipsUsdc: projectList.reduce(
      (total, project) => total + project.metrics.tipsUsdc,
      0,
    ),
    weeklyTipsUsdc: projectList.reduce(
      (total, project) => total + project.metrics.weeklyTipsUsdc,
      0,
    ),
  };
}

export async function getProjectTipData(project: Project): Promise<ProjectTipData> {
  const tips = await getDatabaseTips(project);
  const weekCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);

  return {
    leaderboard: buildTipLeaderboard(tips).slice(0, 5),
    totalUsdc: tips.reduce((total, tip) => total + tip.amountUsdc, 0),
    weeklyUsdc: tips.reduce(
      (total, tip) =>
        new Date(tip.timestamp) >= weekCutoff
          ? total + tip.amountUsdc
          : total,
      0,
    ),
  };
}

async function getDatabaseProjects() {
  if (!db) {
    return null;
  }

  try {
    const rows = await db
      .select()
      .from(projectsTable)
      .orderBy(asc(projectsTable.rank), asc(projectsTable.name));
    if (rows.length === 0) {
      return null;
    }

    const indexedTipRows = await db
      .select({
        amountUsdcMicro: tipsTable.amountUsdcMicro,
        createdAt: tipsTable.createdAt,
        projectId: tipsTable.projectId,
      })
      .from(tipsTable)
      .where(isNotNull(tipsTable.blockNumber));
    const indexedMetrics = buildIndexedProjectMetrics(indexedTipRows);

    return rows.map((row) => mapDatabaseProject(row, indexedMetrics.get(row.id)));
  } catch {
    return null;
  }
}

type DatabaseProject = typeof projectsTable.$inferSelect;

function mapDatabaseProject(
  row: DatabaseProject,
  indexedMetrics: { tipsUsdc: number; weeklyTipsUsdc: number } = {
    tipsUsdc: 0,
    weeklyTipsUsdc: 0,
  },
): Project {
  const seedProject = projects.find((project) => project.slug === row.slug);
  const databaseLinks = normalizeProjectLinks(row.socialLinks);

  return {
    accent: row.accent as Project["accent"],
    activity: row.activity,
    builder: row.builderName,
    category: row.category as ProjectCategory,
    description: row.description,
    featured: row.featured,
    id: row.id,
    lastSignal: row.lastSignal ?? "Indexed in ArcRadar",
    links:
      databaseLinks.length > 0 ? databaseLinks : (seedProject?.links ?? []),
    logoUrl: row.logoUrl,
    metrics: {
      launches: row.launches,
      rank: row.rank,
      tipsUsdc: indexedMetrics.tipsUsdc,
      weeklyTipsUsdc: indexedMetrics.weeklyTipsUsdc,
    },
    name: row.name,
    profile: row.profile as ProjectProfile,
    slug: row.slug,
    tagline: row.tagline,
    tags: row.tags,
    walletAddress: row.projectWallet as `0x${string}`,
  };
}

function normalizeProjectLinks(links: ProjectLink[]) {
  const allowedLabels = new Set<ProjectLink["label"]>([
    "Website",
    "Project X",
    "Builder X",
    "Discord",
    "GitHub",
  ]);

  return links.filter(
    (link): link is ProjectLink =>
      allowedLabels.has(link.label) && Boolean(link.href?.trim()),
  );
}

function fromUsdcMicro(value: bigint) {
  return Number(value) / 1_000_000;
}

async function getDatabaseTips(project: Project): Promise<ProjectTip[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select()
      .from(tipsTable)
      .where(
        and(
          eq(tipsTable.projectId, project.id),
          isNotNull(tipsTable.blockNumber),
        ),
      )
      .orderBy(desc(tipsTable.createdAt))
      .limit(200);

    return rows.map((row) => ({
      amountUsdc: fromUsdcMicro(row.amountUsdcMicro),
      id: row.id,
      message: row.message ?? "Supported this project on Arc Testnet.",
      projectSlug: project.slug,
      timestamp: row.createdAt.toISOString().slice(0, 10),
      tipperAddress: row.tipperAddress as `0x${string}`,
      transactionHash: row.transactionHash as `0x${string}`,
    }));
  } catch {
    return [];
  }
}

function buildIndexedProjectMetrics(
  rows: Array<{
    amountUsdcMicro: bigint;
    createdAt: Date;
    projectId: string;
  }>,
) {
  const weekCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);
  const metrics = new Map<
    string,
    { tipsUsdc: number; weeklyTipsUsdc: number }
  >();

  for (const row of rows) {
    const current = metrics.get(row.projectId) ?? {
      tipsUsdc: 0,
      weeklyTipsUsdc: 0,
    };
    const amountUsdc = fromUsdcMicro(row.amountUsdcMicro);

    current.tipsUsdc += amountUsdc;

    if (row.createdAt >= weekCutoff) {
      current.weeklyTipsUsdc += amountUsdc;
    }

    metrics.set(row.projectId, current);
  }

  return metrics;
}

function buildTipLeaderboard(tips: ProjectTip[]): ProjectTipperRank[] {
  const ranks = new Map<`0x${string}`, ProjectTipperRank>();

  for (const tip of tips) {
    const current = ranks.get(tip.tipperAddress) ?? {
      address: tip.tipperAddress,
      tipCount: 0,
      totalUsdc: 0,
    };

    current.tipCount += 1;
    current.totalUsdc += tip.amountUsdc;
    ranks.set(tip.tipperAddress, current);
  }

  return [...ranks.values()].sort((a, b) => b.totalUsdc - a.totalUsdc);
}

function getRelatednessScore(source: Project, candidate: Project) {
  const sharedTags = candidate.tags.filter((tag) =>
    source.tags.includes(tag),
  ).length;

  return (
    (source.category === candidate.category ? 30 : 0) +
    sharedTags * 8
  );
}
