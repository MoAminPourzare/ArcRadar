import {
  Activity,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  ReceiptText,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { arcLinks } from "@/config/arc";
import { formatCompactNumber, shortenAddress } from "@/lib/utils";
import type {
  LeaderboardData,
  LeaderboardProjectRow,
  TipperLeaderboardRow,
} from "@/types/project";

type LeaderboardProps = {
  data: LeaderboardData;
};

export function Leaderboard({ data }: LeaderboardProps) {
  return (
    <section className="bg-paper py-12 text-ink" id="leaderboard">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-mint/40 bg-mint/20 px-2.5 text-xs font-black uppercase text-forest">
                <Activity aria-hidden className="size-3.5" />
                TipRouter indexed
              </span>
              <span className="inline-flex min-h-8 items-center rounded-md border border-ink/10 bg-white px-2.5 text-xs font-black uppercase text-ink/45">
                Arc Testnet USDC
              </span>
            </div>
            <p className="text-sm font-black uppercase text-blueprint">
              Leaderboard
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-ink sm:text-4xl">
              Indexed project support
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
              A simple view of real indexed tips, supported projects, and
              participating wallets.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white px-4 py-3 shadow-sm">
            <Clock3 aria-hidden className="size-4 text-blueprint" />
            <div>
              <p className="text-xs font-black uppercase text-ink/40">
                Latest tip
              </p>
              <p className="font-mono text-sm font-black text-ink">
                {formatDate(data.stats.latestTipAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            icon={CircleDollarSign}
            label="Total support"
            supporting="indexed USDC"
            value={`${formatCompactNumber(data.stats.totalUsdc)} USDC`}
          />
          <MetricTile
            icon={ReceiptText}
            label="Tip events"
            supporting="onchain records"
            value={formatCompactNumber(data.stats.totalTips)}
          />
          <MetricTile
            icon={Wallet}
            label="Tippers"
            supporting="unique wallets"
            value={formatCompactNumber(data.stats.uniqueTippers)}
          />
          <MetricTile
            icon={Users}
            label="Supported projects"
            supporting="with indexed tips"
            value={formatCompactNumber(data.stats.activeProjects)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-4 py-4 sm:px-5">
              <div>
                <p className="text-xs font-black uppercase text-blueprint">
                  Top projects
                </p>
                <h2 className="mt-1 text-xl font-black text-ink">
                  USDC support table
                </h2>
              </div>
              <Trophy aria-hidden className="size-6 text-amber" />
            </div>

            <div className="divide-y divide-ink/10">
              {data.topProjects.length > 0 ? (
                data.topProjects.map((row, index) => (
                  <ProjectRankRow index={index} key={row.project.id} row={row} />
                ))
              ) : (
                <div className="p-5">
                  <EmptyState label="No indexed project support yet." />
                </div>
              )}
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <TopTippersPanel tippers={data.topTippers} />
            <RecentProjectsPanel projects={data.recentProjects} />
          </aside>
        </div>
      </div>
    </section>
  );
}

function ProjectRankRow({
  index,
  row,
}: {
  index: number;
  row: LeaderboardProjectRow;
}) {
  return (
    <div className="grid gap-4 px-4 py-4 transition hover:bg-paper/70 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_minmax(150px,210px)] md:items-center">
      <span className="grid size-9 place-items-center rounded-md bg-ink text-sm font-black text-paper">
        {index + 1}
      </span>

      <div className="min-w-0">
        <Link
          className="block truncate text-lg font-black text-ink transition hover:text-blueprint"
          href={`/projects/${row.project.slug}`}
        >
          {row.project.name}
        </Link>
        <p className="mt-1 truncate text-sm font-semibold text-ink/50">
          {row.project.category} / {row.project.builder}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-right">
        <MiniMetric label="Total" value={formatUsdc(row.totalUsdc)} />
        <MiniMetric label="Tips" value={formatCompactNumber(row.tipCount)} />
      </div>
    </div>
  );
}

function TopTippersPanel({ tippers }: { tippers: TipperLeaderboardRow[] }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-blueprint">
            Top tippers
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">Wallet support</h2>
        </div>
        <Wallet aria-hidden className="size-5 text-forest" />
      </div>
      <div className="grid gap-2">
        {tippers.length > 0 ? (
          tippers.map((tipper, index) => (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-ink/10 bg-paper p-3"
              key={tipper.address}
            >
              <span className="grid size-8 place-items-center rounded-md bg-ink text-xs font-black text-paper">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-black text-ink">
                  {shortenAddress(tipper.address)}
                </p>
                <p className="text-xs font-bold text-ink/45">
                  {tipper.tipCount} tips / {tipper.projectCount} projects
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-black text-forest">
                  {formatUsdc(tipper.totalUsdc)}
                </p>
                {tipper.lastTransactionHash ? (
                  <a
                    aria-label="Open latest tip transaction"
                    className="ml-auto mt-1 grid size-7 place-items-center rounded-md bg-ink/5 text-ink transition hover:bg-ink hover:text-paper"
                    href={`${arcLinks.explorer}/tx/${tipper.lastTransactionHash}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState label="No indexed tipper data yet." />
        )}
      </div>
    </section>
  );
}

function RecentProjectsPanel({
  projects,
}: {
  projects: LeaderboardProjectRow[];
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-blueprint">
            Recent support
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">Latest projects</h2>
        </div>
        <Activity aria-hidden className="size-5 text-blueprint" />
      </div>
      <div className="grid gap-2">
        {projects.length > 0 ? (
          projects.map((row) => (
            <Link
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-ink/10 bg-paper p-3 transition hover:border-blueprint/35"
              href={`/projects/${row.project.slug}`}
              key={row.project.id}
            >
              <span className="min-w-0">
                <span className="block truncate font-black text-ink">
                  {row.project.name}
                </span>
                <span className="block text-xs font-bold text-ink/45">
                  {formatDate(row.lastTippedAt)}
                </span>
              </span>
              <span className="font-mono text-sm font-black text-forest">
                {formatUsdc(row.totalUsdc)}
              </span>
            </Link>
          ))
        ) : (
          <EmptyState label="No recent project support yet." />
        )}
      </div>
    </section>
  );
}

function MetricTile({
  icon: Icon,
  label,
  supporting,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  supporting: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Icon aria-hidden className="size-5 text-blueprint" />
        <span className="text-xs font-black uppercase text-ink/40">
          {label}
        </span>
      </div>
      <p className="break-words font-mono text-2xl font-black text-ink sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-sm font-bold text-ink/50">{supporting}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper px-2 py-2">
      <p className="font-mono text-sm font-black text-ink">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-ink/40">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-ink/15 bg-paper p-3 text-sm font-semibold text-ink/45">
      {label}
    </p>
  );
}

function formatUsdc(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Awaiting tips";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}
