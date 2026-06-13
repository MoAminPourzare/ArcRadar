import { Activity, ArrowUpRight, Radio, ScanLine } from "lucide-react";
import Link from "next/link";

import type { Project } from "@/types/project";
import type { ProjectSocialSignal } from "@/types/social";

const accentClass: Record<Project["accent"], string> = {
  amber: "bg-amber text-[#111312]",
  blueprint: "bg-blueprint text-[#f5f2ea]",
  coral: "bg-coral text-[#f5f2ea]",
  cyan: "bg-cyan text-[#111312]",
  mint: "bg-mint text-[#111312]",
};

export function SignalRadar({ signals }: { signals: ProjectSocialSignal[] }) {
  const rankedSignals = [...signals].sort(
    (a, b) => b.score.total - a.score.total,
  );
  const featuredSignals = rankedSignals.slice(0, 9);
  const remainingSignalCount = Math.max(
    rankedSignals.length - featuredSignals.length,
    0,
  );
  const strongestSignal = rankedSignals[0];

  return (
    <div className="overflow-hidden rounded-lg border border-[#f5f2ea]/10 bg-[#111312] text-[#f5f2ea] shadow-sm">
      <div className="flex items-center justify-between border-b border-[#f5f2ea]/10 bg-[#111312]/90 px-4 py-3 backdrop-blur">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase text-mint">
          <Radio aria-hidden className="size-4" />
          Live signal map
        </span>
        <span className="font-mono text-xs font-black text-[#f5f2ea]/55">
          {rankedSignals.length} PROJECTS
        </span>
      </div>

      <div className="relative p-4 sm:p-5">
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, transparent 0, transparent 28%, rgba(245,242,234,0.07) 28.2%, transparent 28.6%, transparent 48%, rgba(245,242,234,0.06) 48.2%, transparent 48.6%), linear-gradient(rgba(245,242,234,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(245,242,234,0.07) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 32px 32px, 32px 32px",
          }}
        />

        <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-3">
          {featuredSignals.map((signal, index) => (
            <Link
              className="group flex min-h-24 flex-col justify-between rounded-lg border border-[#f5f2ea]/10 bg-[#111312]/90 p-3 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-mint/60 hover:bg-[#1a1d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
              href={`/projects/${signal.project.slug}`}
              key={signal.project.id}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`grid size-7 shrink-0 rotate-45 place-items-center rounded-md ${accentClass[signal.project.accent]}`}
                >
                  <span className="-rotate-45 font-mono text-[11px] font-black">
                    {index + 1}
                  </span>
                </span>
                <span className="font-mono text-sm font-black text-mint">
                  {signal.score.total}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-black leading-tight text-[#f5f2ea]">
                    {signal.project.name}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-black uppercase text-[#f5f2ea]/45">
                    {signal.project.category}
                  </p>
                </div>
                <ArrowUpRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-[#f5f2ea]/35 transition group-hover:text-mint"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 border-t border-[#f5f2ea]/10 p-4 sm:grid-cols-[1fr_auto] sm:items-stretch">
        <div className="rounded-lg border border-[#f5f2ea]/10 bg-[#f5f2ea]/[0.06] p-4">
          <div className="mb-3 flex items-center gap-2 text-mint">
            <Activity aria-hidden className="size-4" />
            <span className="text-xs font-black uppercase">Top signal</span>
          </div>
          <p className="text-xl font-black">
            {strongestSignal?.project.name ?? "Awaiting projects"}
          </p>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-[#f5f2ea]/55">
            {strongestSignal?.project.lastSignal ?? "No signal indexed yet"}
          </p>
          {remainingSignalCount > 0 ? (
            <Link
              className="mt-3 inline-flex items-center gap-1 text-xs font-black text-mint hover:underline"
              href="/projects"
            >
              View {remainingSignalCount} more projects
              <ArrowUpRight aria-hidden className="size-3" />
            </Link>
          ) : null}
        </div>

        <div className="min-w-36 rounded-lg border border-[#f5f2ea]/10 bg-[#f5f2ea] p-4 text-[#111312]">
          <span className="flex items-center gap-2 text-xs font-black uppercase text-[#111312]/45">
            <ScanLine aria-hidden className="size-4" />
            Signal score
          </span>
          <p className="mt-2 font-mono text-4xl font-black">
            {strongestSignal?.score.total ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
