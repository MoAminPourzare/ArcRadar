import { projects } from "@/data/projects";
import { projectTips } from "@/data/tips";
import { db } from "@/server/db/client";
import { projects as projectsTable, tips as tipsTable } from "@/server/db/schema";
import type {
  Project,
  ProjectCategory,
  ProjectProfile,
  ProjectStatus,
  ProjectTip,
  ProjectTipData,
  ProjectTipperRank,
} from "@/types/project";
import { asc, desc, eq } from "drizzle-orm";

export type ProjectFilters = {
  category?: ProjectCategory;
  status?: ProjectStatus;
  featured?: boolean;
};

export async function getProjects(filters: ProjectFilters = {}) {
  const databaseProjects = await getDatabaseProjects();
  let result = databaseProjects ?? [...projects];

  if (filters.category) {
    result = result.filter((project) => project.category === filters.category);
  }

  if (filters.status) {
    result = result.filter((project) => project.status === filters.status);
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

      if (project && project.status !== "archived") {
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
    totalSupporters: projectList.reduce(
      (total, project) => total + project.metrics.supporters,
      0,
    ),
  };
}

export async function getProjectTipData(project: Project): Promise<ProjectTipData> {
  const databaseTips = await getDatabaseTips(project);
  const tips =
    databaseTips.length > 0
      ? databaseTips
      : projectTips
          .filter((tip) => tip.projectSlug === project.slug)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    latestTips: tips.slice(0, 5),
    leaderboard: buildTipLeaderboard(tips).slice(0, 5),
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
    const activeProjects = rows.filter((row) => row.status !== "archived");

    if (activeProjects.length === 0) {
      return null;
    }

    return activeProjects.map(mapDatabaseProject);
  } catch {
    return null;
  }
}

type DatabaseProject = typeof projectsTable.$inferSelect;

function mapDatabaseProject(row: DatabaseProject): Project {
  return {
    accent: row.accent as Project["accent"],
    activity: row.activity,
    builder: row.builderName,
    category: row.category as ProjectCategory,
    description: row.description,
    featured: row.featured,
    id: row.id,
    lastSignal: row.lastSignal ?? "Indexed in ArcRadar",
    links: row.socialLinks as Project["links"],
    metrics: {
      launches: row.launches,
      rank: row.rank,
      signalScore: row.signalScore,
      supporters: row.supporters,
      tipsUsdc: fromUsdcMicro(row.totalTipsUsdcMicro),
      weeklyTipsUsdc: fromUsdcMicro(row.weeklyTipsUsdcMicro),
    },
    name: row.name,
    profile: row.profile as ProjectProfile,
    slug: row.slug,
    stage: row.stage as Project["stage"],
    status: row.status as ProjectStatus,
    tagline: row.tagline,
    tags: row.tags,
    walletAddress: row.projectWallet as `0x${string}`,
  };
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
      .where(eq(tipsTable.projectId, project.id))
      .orderBy(desc(tipsTable.createdAt))
      .limit(20);

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
    (source.status === candidate.status ? 10 : 0) +
    sharedTags * 8 +
    candidate.metrics.signalScore / 10
  );
}
