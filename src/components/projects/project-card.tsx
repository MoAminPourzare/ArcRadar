import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Radio,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { shortenAddress } from "@/lib/utils";
import type { Project } from "@/types/project";
import type { ProjectSocialSignal } from "@/types/social";

const statusLabel: Record<Project["status"], string> = {
  building: "Building",
  live: "Live",
  testnet: "Testnet",
  watchlist: "Watchlist",
};

const accentClass: Record<Project["accent"], string> = {
  amber: "bg-amber text-ink",
  blueprint: "bg-blueprint text-paper",
  coral: "bg-coral text-paper",
  cyan: "bg-cyan text-ink",
  mint: "bg-mint text-ink",
};

const badgeToneClass: Record<ProjectSocialSignal["badges"][number]["tone"], string> = {
  amber: "bg-amber/20 text-ink",
  blueprint: "bg-blueprint/10 text-blueprint",
  coral: "bg-coral/15 text-coral",
  cyan: "bg-cyan/20 text-blueprint",
  forest: "bg-mint/20 text-forest",
  ink: "bg-ink/10 text-ink",
  mint: "bg-mint/25 text-forest",
};

export function ProjectCard({
  project,
  socialSignal,
}: {
  project: Project;
  socialSignal?: ProjectSocialSignal;
}) {
  const visibleBadges = socialSignal?.badges.slice(0, 3) ?? [];
  const signalScore = socialSignal?.score.total ?? project.metrics.signalScore;
  const isVerified = socialSignal?.claimStatus === "verified";

  return (
    <article className="group flex min-h-[410px] flex-col justify-between rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-md">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid size-12 place-items-center rounded-lg text-lg font-black ${accentClass[project.accent]}`}
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-black text-ink">{project.name}</h3>
              <p className="text-sm font-semibold text-ink/55">
                {project.category}
              </p>
            </div>
          </div>
          <div className="grid justify-items-end gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-cyan/15 px-2.5 py-1 text-xs font-black uppercase text-blueprint">
              <Radio aria-hidden className="size-3" />
              {statusLabel[project.status]}
            </span>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-mint/20 px-2 py-1 text-[11px] font-black uppercase text-forest">
                <BadgeCheck aria-hidden className="size-3" />
                Verified
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-ink/10 bg-paper px-3 py-2">
          <div>
            <p className="text-xs font-black uppercase text-ink/40">Stage</p>
            <p className="text-sm font-black text-ink">{project.stage}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase text-ink/40">Signal</p>
            <p className="font-mono text-lg font-black text-blueprint">
              {signalScore}
            </p>
          </div>
        </div>

        {visibleBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleBadges.map((badge) => (
              <span
                className={`rounded-md px-2.5 py-1 text-[11px] font-black uppercase ${badgeToneClass[badge.tone]}`}
                key={badge.label}
                title={badge.description}
              >
                {badge.label}
              </span>
            ))}
          </div>
        ) : null}

        <div>
          <p className="text-base font-black text-ink">{project.tagline}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/60">
            {project.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              className="rounded-md bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/60"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-ink/10 pt-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span className="block text-xs font-bold uppercase text-ink/40">
              Rank
            </span>
            <span className="font-mono font-black text-ink">
              #{project.metrics.rank}
            </span>
          </div>
          <div>
            <span className="block text-xs font-bold uppercase text-ink/40">
              Total
            </span>
            <span className="font-mono font-black text-ink">
              {project.metrics.tipsUsdc} USDC
            </span>
          </div>
          <div>
            <span className="block text-xs font-bold uppercase text-ink/40">
              Week
            </span>
            <span className="font-mono font-black text-ink">
              {project.metrics.weeklyTipsUsdc}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-2 rounded-lg border border-ink/10 bg-paper p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-ink/40">
              <Wallet aria-hidden className="size-3.5" />
              Tip target
            </span>
            <span className="font-mono text-xs font-black text-ink">
              {shortenAddress(project.walletAddress)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-ink/40">
              <CircleDollarSign aria-hidden className="size-3.5" />
              Backers
            </span>
            <span className="font-mono text-xs font-black text-ink">
              {project.metrics.supporters}
            </span>
          </div>
          {socialSignal ? (
            <div className="grid grid-cols-3 gap-2 border-t border-ink/10 pt-3">
              <MicroSignal label="Tip" value={socialSignal.score.tip} />
              <MicroSignal label="Social" value={socialSignal.score.social} />
              <MicroSignal label="Fresh" value={socialSignal.score.freshness} />
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-bold text-forest">
              <BadgeCheck aria-hidden className="size-4 shrink-0" />
              <span className="truncate">{project.builder}</span>
            </span>
            <p className="mt-1 truncate text-xs font-semibold text-ink/45">
              {project.lastSignal}
            </p>
          </div>
          <Link
            aria-label={`View ${project.name} profile`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-black uppercase text-paper transition group-hover:bg-blueprint"
            href={`/projects/${project.slug}`}
          >
            Profile
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function MicroSignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white px-2 py-1 text-right">
      <p className="font-mono text-xs font-black text-ink">{value}</p>
      <p className="text-[10px] font-black uppercase text-ink/35">{label}</p>
    </div>
  );
}
