import { getDb } from "@/server/db/client";
import { projects as projectsTable, tips as tipsTable } from "@/server/db/schema";
import type { Project, ProjectTip } from "@/types/project";
import type {
  ProjectSocialSignal,
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

  return {
    projects: signals,
  };
}

async function getTipRows(): Promise<ProjectTip[]> {
  const db = getDb();

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

function getSocialLinkWeight(project: Project) {
  const labels = new Set(project.links.map((link) => link.label));

  return (
    (labels.has("Website") ? 3 : 0) +
    (labels.has("Project X") ? 4 : 0) +
    (labels.has("Builder X") ? 3 : 0) +
    (labels.has("GitHub") ? 5 : 0)
  );
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
