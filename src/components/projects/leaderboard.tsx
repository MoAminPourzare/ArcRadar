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
    <section className="bg-ink py-14 text-paper" id="leaderboard">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-mint/30 bg-mint/15 px-2.5 text-xs font-black uppercase text-mint">
                <Activity aria-hidden className="size-3.5" />
                TipRouter indexed
              </span>
              <span className="inline-flex min-h-8 items-center rounded-md border border-paper/10 bg-paper/[0.04] px-2.5 text-xs font-black uppercase text-paper/50">
                Arc Testnet USDC
              </span>
            </div>
            <p className="text-sm font-black uppercase text-mint">
              Leaderboard and stats
            </p>
            <h1 className="mt-2 max-w-3xl text-2xl font-black leading-tight sm:text-3xl">
              Onchain support signals for the Arc builder map
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-paper/10 bg-paper/[0.04] px-4 py-3">
            <Clock3 aria-hidden className="size-4 text-paper/45" />
            <div>
              <p className="text-xs font-black uppercase text-paper/40">
                Latest signal
              </p>
              <p className="font-mono text-sm font-black">
                {formatDate(data.stats.latestTipAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            icon={CircleDollarSign}
            label="Ecosystem support"
            supporting={`${formatUsdc(data.stats.weeklyUsdc)} weekly`}
            value={`${formatCompactNumber(data.stats.totalUsdc)} USDC`}
          />
          <MetricTile
            icon={ReceiptText}
            label="Tip events"
            supporting={`${formatUsdc(data.stats.monthlyUsdc)} monthly`}
            value={formatCompactNumber(data.stats.totalTips)}
          />
          <MetricTile
            icon={Wallet}
            label="Top wallets"
            supporting="unique tippers"
            value={formatCompactNumber(data.stats.uniqueTippers)}
          />
          <MetricTile
            icon={Users}
            label="Active projects"
            supporting="with support"
            value={formatCompactNumber(data.stats.activeProjects)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-lg border border-paper/10 bg-paper/[0.03]">
            <div className="flex items-center justify-between gap-4 border-b border-paper/10 px-4 py-4 sm:px-5">
              <div>
                <p className="text-xs font-black uppercase text-paper/45">
                  Top projects
                </p>
                <h3 className="mt-1 text-xl font-black">USDC support table</h3>
              </div>
              <Trophy aria-hidden className="size-6 text-amber" />
            </div>

            <div className="divide-y divide-paper/10">
              {data.topProjects.map((row, index) => (
                <ProjectRankRow index={index} key={row.project.id} row={row} />
              ))}
            </div>
          </section>

          <aside className="grid content-start gap-4">
            <TopTippersPanel tippers={data.topTippers} />
            <RecentProjectsPanel projects={data.recentProjects} />
          </aside>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MomentumPanel
            label="Weekly ranking"
            projects={data.weeklyRanking}
            valueKey="weeklyUsdc"
          />
          <MomentumPanel
            label="Monthly ranking"
            projects={data.monthlyRanking}
            valueKey="monthlyUsdc"
          />
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
    <div className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_minmax(210px,260px)] md:items-center">
      <span className="grid size-9 place-items-center rounded-md bg-paper text-sm font-black text-ink">
        {index + 1}
      </span>

      <div className="min-w-0">
        <div className="mb-2">
          <Link
            className="min-w-0 truncate text-lg font-black transition hover:text-mint"
            href={`/projects/${row.project.slug}`}
          >
            {row.project.name}
          </Link>
        </div>
        <p className="truncate text-sm font-semibold text-paper/55">
          {row.project.category} / {row.project.builder}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-right">
        <MiniMetric label="Total" value={formatUsdc(row.totalUsdc)} />
        <MiniMetric label="Weekly" value={formatUsdc(row.weeklyUsdc)} />
        <MiniMetric label="Tips" value={formatCompactNumber(row.tipCount)} />
      </div>
    </div>
  );
}

function TopTippersPanel({ tippers }: { tippers: TipperLeaderboardRow[] }) {
  return (
    <section className="rounded-lg border border-paper/10 bg-paper p-5 text-ink">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-ink/40">
            Top tippers
          </p>
          <h3 className="mt-1 text-xl font-black">Wallet support</h3>
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
                <p className="truncate font-mono text-sm font-black">
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
          <EmptyState label="No tipper data indexed yet." />
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
    <section className="rounded-lg border border-paper/10 bg-paper/[0.06] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-paper/45">
            Fresh signal
          </p>
          <h3 className="mt-1 text-xl font-black">Recent projects</h3>
        </div>
        <Activity aria-hidden className="size-5 text-mint" />
      </div>
      <div className="grid gap-2">
        {projects.length > 0 ? (
          projects.map((row) => (
            <Link
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-paper/10 bg-ink/20 p-3 transition hover:border-mint/40"
              href={`/projects/${row.project.slug}`}
              key={row.project.id}
            >
              <span className="min-w-0">
                <span className="block truncate font-black">
                  {row.project.name}
                </span>
                <span className="block text-xs font-bold text-paper/45">
                  {formatDate(row.lastTippedAt)}
                </span>
              </span>
              <span className="font-mono text-sm font-black text-mint">
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

function MomentumPanel({
  label,
  projects,
  valueKey,
}: {
  label: string;
  projects: LeaderboardProjectRow[];
  valueKey: "monthlyUsdc" | "weeklyUsdc";
}) {
  return (
    <section className="rounded-lg border border-paper/10 bg-paper/[0.035] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-paper/45">{label}</p>
          <h3 className="mt-1 text-xl font-black">Momentum board</h3>
        </div>
        <Activity aria-hidden className="size-5 text-cyan" />
      </div>
      <div className="grid gap-2">
        {projects.length > 0 ? (
          projects.map((row, index) => (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-paper/10 bg-paper/[0.04] p-3"
              key={`${label}-${row.project.id}`}
            >
              <span className="grid size-8 place-items-center rounded-md bg-paper text-xs font-black text-ink">
                {index + 1}
              </span>
              <div className="min-w-0">
                <Link
                  className="block truncate font-black transition hover:text-mint"
                  href={`/projects/${row.project.slug}`}
                >
                  {row.project.name}
                </Link>
                <p className="truncate text-xs font-bold text-paper/45">
                  {row.tipCount} tip events
                </p>
              </div>
              <span className="font-mono text-sm font-black text-cyan">
                {formatUsdc(row[valueKey])}
              </span>
            </div>
          ))
        ) : (
          <EmptyState label="No momentum data yet." />
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
    <div className="rounded-lg border border-paper/10 bg-paper/[0.05] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Icon aria-hidden className="size-5 text-mint" />
        <span className="text-xs font-black uppercase text-paper/40">
          {label}
        </span>
      </div>
      <p className="break-words font-mono text-2xl font-black sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-sm font-bold text-paper/50">{supporting}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-paper/10 bg-paper/[0.04] px-2 py-2">
      <p className="font-mono text-sm font-black">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-paper/40">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-paper/15 bg-paper/[0.04] p-3 text-sm font-semibold text-paper/45">
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
