import { db } from "@/server/db/client";
import { projects as projectsTable, tips as tipsTable } from "@/server/db/schema";
import type {
  LeaderboardData,
  LeaderboardProjectRow,
  Project,
  TipperLeaderboardRow,
} from "@/types/project";
import { desc, eq, isNotNull } from "drizzle-orm";

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

  return buildLeaderboard(projectList, indexedTips);
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
      .where(isNotNull(tipsTable.blockNumber))
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

function buildLeaderboard(
  projectList: Project[],
  tipRows: TipLedgerRow[],
): LeaderboardData {
  const now = new Date();
  const tipsByProject = groupTipsByProject(tipRows);

  const rows = projectList.map((project) =>
    buildProjectRow(project, tipsByProject.get(project.slug) ?? []),
  );

  const topProjects = [...rows]
    .sort(
      (a, b) =>
        b.totalUsdc - a.totalUsdc ||
        b.tipCount - a.tipCount ||
        a.project.metrics.rank - b.project.metrics.rank,
    );
  const recentProjects = [...rows]
    .filter((row) => row.lastTippedAt)
    .sort(compareLatestTip)
    .slice(0, 6);
  const topTippers = buildTopTippers(tipRows).slice(0, 6);

  return {
    recentProjects,
    stats: buildStats(rows, tipRows, now),
    topProjects,
    topTippers,
  };
}

function buildProjectRow(
  project: Project,
  tips: TipLedgerRow[],
): LeaderboardProjectRow {
  const totalFromTips = sumTips(tips);
  const latestTip = getLatestTip(tips);
  return {
    lastTippedAt: latestTip?.timestamp.toISOString() ?? null,
    lastTransactionHash: latestTip?.transactionHash ?? null,
    project,
    tipCount: tips.length,
    totalUsdc: roundUsdc(totalFromTips),
  };
}

function buildStats(
  rows: LeaderboardProjectRow[],
  tipRows: TipLedgerRow[],
  now: Date,
) {
  const latestTip = getLatestTip(tipRows);
  const uniqueTippers = new Set(
    tipRows.map((tip) => tip.tipperAddress.toLowerCase()),
  );

  return {
    activeProjects: rows.filter((row) => row.totalUsdc > 0).length,
    generatedAt: now.toISOString(),
    latestTipAt: latestTip?.timestamp.toISOString() ?? null,
    totalTips: tipRows.length,
    totalUsdc: roundUsdc(sumTips(tipRows)),
    uniqueTippers: uniqueTippers.size,
  };
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

function fromUsdcMicro(value: bigint) {
  return Number(value) / USDC_MICRO;
}

function roundUsdc(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
