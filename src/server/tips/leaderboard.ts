import { projectTips } from "@/data/tips";
import { db } from "@/server/db/client";
import { projects as projectsTable, tips as tipsTable } from "@/server/db/schema";
import type {
  LeaderboardData,
  LeaderboardProjectRow,
  LeaderboardSource,
  Project,
  ProjectBadge,
  TipperLeaderboardRow,
} from "@/types/project";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";

const USDC_MICRO = 1_000_000;

type TipLedgerRow = {
  amountUsdc: number;
  blockNumber: bigint | null;
  projectSlug: string;
  timestamp: Date;
  tipperAddress: `0x${string}`;
  transactionHash: `0x${string}`;
};

export async function getLeaderboardData(
  projectList: Project[],
): Promise<LeaderboardData> {
  const indexedTips = await getIndexedTipRows();

  if (indexedTips.length > 0) {
    return buildLeaderboard(projectList, indexedTips, "indexed");
  }

  return buildLeaderboard(projectList, getCuratedTipRows(), "curated");
}

async function getIndexedTipRows(): Promise<TipLedgerRow[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select({
        amountUsdcMicro: tipsTable.amountUsdcMicro,
        blockNumber: tipsTable.blockNumber,
        createdAt: tipsTable.createdAt,
        projectSlug: projectsTable.slug,
        tipperAddress: tipsTable.tipperAddress,
        transactionHash: tipsTable.transactionHash,
      })
      .from(tipsTable)
      .innerJoin(projectsTable, eq(tipsTable.projectId, projectsTable.id))
      .where(
        and(ne(projectsTable.status, "archived"), isNotNull(tipsTable.blockNumber)),
      )
      .orderBy(desc(tipsTable.createdAt));

    return rows.map((row) => ({
      amountUsdc: fromUsdcMicro(row.amountUsdcMicro),
      blockNumber: row.blockNumber,
      projectSlug: row.projectSlug,
      timestamp: row.createdAt,
      tipperAddress: row.tipperAddress as `0x${string}`,
      transactionHash: row.transactionHash as `0x${string}`,
    }));
  } catch {
    return [];
  }
}

function getCuratedTipRows(): TipLedgerRow[] {
  return projectTips.map((tip) => ({
    amountUsdc: tip.amountUsdc,
    blockNumber: null,
    projectSlug: tip.projectSlug,
    timestamp: new Date(tip.timestamp),
    tipperAddress: tip.tipperAddress,
    transactionHash: tip.transactionHash,
  }));
}

function buildLeaderboard(
  projectList: Project[],
  tipRows: TipLedgerRow[],
  source: LeaderboardSource,
): LeaderboardData {
  const now = new Date();
  const weekCutoff = getDayCutoff(now, 7);
  const monthCutoff = getDayCutoff(now, 30);
  const tipsByProject = groupTipsByProject(tipRows);

  const rows = projectList.map((project) =>
    buildProjectRow(project, tipsByProject.get(project.slug) ?? [], {
      monthCutoff,
      source,
      weekCutoff,
    }),
  );

  applyBadges(rows);

  const topProjects = [...rows]
    .sort((a, b) => b.totalUsdc - a.totalUsdc || b.tipCount - a.tipCount)
    .slice(0, 8);
  const recentProjects = [...rows]
    .filter((row) => row.lastTippedAt)
    .sort(compareLatestTip)
    .slice(0, 6);
  const weeklyRanking = [...rows]
    .filter((row) => row.weeklyUsdc > 0)
    .sort((a, b) => b.weeklyUsdc - a.weeklyUsdc || b.tipCount - a.tipCount)
    .slice(0, 6);
  const monthlyRanking = [...rows]
    .filter((row) => row.monthlyUsdc > 0)
    .sort((a, b) => b.monthlyUsdc - a.monthlyUsdc || b.tipCount - a.tipCount)
    .slice(0, 6);
  const topTippers = buildTopTippers(tipRows).slice(0, 6);

  return {
    monthlyRanking,
    recentProjects,
    source,
    stats: buildStats(rows, tipRows, source, now, weekCutoff, monthCutoff),
    topProjects,
    topTippers,
    weeklyRanking,
  };
}

function buildProjectRow(
  project: Project,
  tips: TipLedgerRow[],
  options: {
    monthCutoff: Date;
    source: LeaderboardSource;
    weekCutoff: Date;
  },
): LeaderboardProjectRow {
  const totalFromTips = sumTips(tips);
  const weeklyFromTips = sumTipsSince(tips, options.weekCutoff);
  const monthlyFromTips = sumTipsSince(tips, options.monthCutoff);
  const latestTip = getLatestTip(tips);
  const uniqueTippers = new Set(
    tips.map((tip) => tip.tipperAddress.toLowerCase()),
  );

  return {
    badges: [],
    lastTippedAt: latestTip?.timestamp.toISOString() ?? null,
    lastTransactionHash: latestTip?.transactionHash ?? null,
    monthlyUsdc: roundUsdc(
      options.source === "indexed"
        ? monthlyFromTips
        : Math.max(monthlyFromTips, project.metrics.weeklyTipsUsdc),
    ),
    project,
    supporterCount:
      options.source === "indexed" ? uniqueTippers.size : project.metrics.supporters,
    tipCount: tips.length,
    totalUsdc: roundUsdc(
      options.source === "indexed" ? totalFromTips : project.metrics.tipsUsdc,
    ),
    weeklyUsdc: roundUsdc(
      options.source === "indexed" ? weeklyFromTips : project.metrics.weeklyTipsUsdc,
    ),
  };
}

function buildStats(
  rows: LeaderboardProjectRow[],
  tipRows: TipLedgerRow[],
  source: LeaderboardSource,
  now: Date,
  weekCutoff: Date,
  monthCutoff: Date,
) {
  const latestTip = getLatestTip(tipRows);
  const uniqueTippers = new Set(
    tipRows.map((tip) => tip.tipperAddress.toLowerCase()),
  );

  return {
    activeProjects: rows.filter((row) => row.totalUsdc > 0).length,
    generatedAt: now.toISOString(),
    latestTipAt: latestTip?.timestamp.toISOString() ?? null,
    monthlyUsdc: roundUsdc(
      source === "indexed"
        ? sumTipsSince(tipRows, monthCutoff)
        : rows.reduce((total, row) => total + row.monthlyUsdc, 0),
    ),
    totalTips: tipRows.length,
    totalUsdc: roundUsdc(
      source === "indexed"
        ? sumTips(tipRows)
        : rows.reduce((total, row) => total + row.totalUsdc, 0),
    ),
    uniqueTippers: uniqueTippers.size,
    weeklyUsdc: roundUsdc(
      source === "indexed"
        ? sumTipsSince(tipRows, weekCutoff)
        : rows.reduce((total, row) => total + row.weeklyUsdc, 0),
    ),
  };
}

function applyBadges(rows: LeaderboardProjectRow[]) {
  const mostTipped = [...rows].sort((a, b) => b.totalUsdc - a.totalUsdc)[0];
  const rising = [...rows]
    .filter((row) => row.weeklyUsdc > 0)
    .sort((a, b) => b.weeklyUsdc - a.weeklyUsdc)[0];
  const freshSignal = [...rows].filter((row) => row.lastTippedAt).sort(compareLatestTip)[0];

  addBadge(mostTipped, "Most Tipped");
  addBadge(rising, "Rising");
  addBadge(freshSignal, "Fresh Signal");
}

function addBadge(row: LeaderboardProjectRow | undefined, badge: ProjectBadge) {
  if (!row || row.badges.includes(badge)) {
    return;
  }

  row.badges.push(badge);
}

function buildTopTippers(tipRows: TipLedgerRow[]): TipperLeaderboardRow[] {
  const tippers = new Map<
    `0x${string}`,
    {
      address: `0x${string}`;
      lastTippedAt: Date;
      lastTransactionHash: `0x${string}` | null;
      projectSlugs: Set<string>;
      tipCount: number;
      totalUsdc: number;
    }
  >();

  for (const tip of tipRows) {
    const current = tippers.get(tip.tipperAddress) ?? {
      address: tip.tipperAddress,
      lastTippedAt: tip.timestamp,
      lastTransactionHash: tip.transactionHash,
      projectSlugs: new Set<string>(),
      tipCount: 0,
      totalUsdc: 0,
    };

    current.tipCount += 1;
    current.totalUsdc += tip.amountUsdc;
    current.projectSlugs.add(tip.projectSlug);

    if (tip.timestamp > current.lastTippedAt) {
      current.lastTippedAt = tip.timestamp;
      current.lastTransactionHash = tip.transactionHash;
    }

    tippers.set(tip.tipperAddress, current);
  }

  return [...tippers.values()]
    .map((tipper) => ({
      address: tipper.address,
      lastTippedAt: tipper.lastTippedAt.toISOString(),
      lastTransactionHash: tipper.lastTransactionHash,
      projectCount: tipper.projectSlugs.size,
      tipCount: tipper.tipCount,
      totalUsdc: roundUsdc(tipper.totalUsdc),
    }))
    .sort((a, b) => b.totalUsdc - a.totalUsdc || b.tipCount - a.tipCount);
}

function groupTipsByProject(tipRows: TipLedgerRow[]) {
  const grouped = new Map<string, TipLedgerRow[]>();

  for (const tip of tipRows) {
    const current = grouped.get(tip.projectSlug) ?? [];
    current.push(tip);
    grouped.set(tip.projectSlug, current);
  }

  return grouped;
}

function getLatestTip(tips: TipLedgerRow[]) {
  return tips.reduce<TipLedgerRow | undefined>((latest, tip) => {
    if (!latest || tip.timestamp > latest.timestamp) {
      return tip;
    }

    return latest;
  }, undefined);
}

function compareLatestTip(a: LeaderboardProjectRow, b: LeaderboardProjectRow) {
  return (
    Date.parse(b.lastTippedAt ?? "1970-01-01") -
    Date.parse(a.lastTippedAt ?? "1970-01-01")
  );
}

function sumTips(tips: TipLedgerRow[]) {
  return tips.reduce((total, tip) => total + tip.amountUsdc, 0);
}

function sumTipsSince(tips: TipLedgerRow[], cutoff: Date) {
  return tips
    .filter((tip) => tip.timestamp >= cutoff)
    .reduce((total, tip) => total + tip.amountUsdc, 0);
}

function getDayCutoff(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function fromUsdcMicro(value: bigint) {
  return Number(value) / USDC_MICRO;
}

function roundUsdc(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
