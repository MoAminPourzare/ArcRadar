import {
  ArrowUpRight,
  CircleDollarSign,
  Gauge,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import type { Project } from "@/types/project";
import type { ProjectSocialSignal } from "@/types/social";

const accentClass: Record<Project["accent"], string> = {
  amber: "bg-amber text-accent-ink",
  blueprint: "bg-blueprint text-paper",
  coral: "bg-coral text-paper",
  cyan: "bg-cyan text-accent-ink",
  mint: "bg-mint text-accent-ink",
};

export function ProjectCard({
  project,
  socialSignal,
}: {
  project: Project;
  socialSignal?: ProjectSocialSignal;
}) {
  const signalScore = socialSignal?.score.total ?? 0;

  return (
    <article className="group flex min-h-[280px] flex-col justify-between rounded-lg border border-ink/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-md">
      <div>
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
          <div className="rounded-lg border border-blueprint/15 bg-blueprint/5 px-3 py-2 text-right">
            <span className="flex items-center justify-end gap-1.5 text-[10px] font-black uppercase text-blueprint/65">
              <Gauge aria-hidden className="size-3" />
              Signal
            </span>
            <span className="font-mono text-2xl font-black text-blueprint">
              {signalScore}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="line-clamp-2 text-base font-black leading-6 text-ink">
            {project.tagline}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <CompactMetric
            icon={CircleDollarSign}
            label="Tips"
            value={`${project.metrics.tipsUsdc}`}
          />
          <CompactMetric
            icon={TrendingUp}
            label="Weekly"
            value={`${project.metrics.weeklyTipsUsdc}`}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
        <div className="min-w-0">
          <span className="inline-flex max-w-full items-center text-xs font-bold text-ink/50">
            <span className="truncate">{project.builder}</span>
          </span>
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
    </article>
  );
}

function CompactMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper px-3 py-2">
      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-ink/35">
        <Icon aria-hidden className="size-3" />
        {label}
      </span>
      <span className="mt-1 block font-mono text-sm font-black text-ink">
        {value}
      </span>
    </div>
  );
}
