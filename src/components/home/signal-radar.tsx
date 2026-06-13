import { Activity, ArrowUpRight, Radio, ScanLine } from "lucide-react";
import Link from "next/link";

import { ProjectLogo } from "@/components/projects/project-logo";
import { cn } from "@/lib/utils";
import type { ProjectSocialSignal } from "@/types/social";

export function SignalRadar({ signals }: { signals: ProjectSocialSignal[] }) {
  const rankedSignals = [...signals].sort(
    (a, b) => b.score.total - a.score.total,
  );
  const featuredSignals = rankedSignals.slice(0, 12);
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

      <div className="relative h-[310px] overflow-hidden sm:h-[360px] lg:h-[390px]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,242,234,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,242,234,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 aspect-square w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f5f2ea]/10 sm:w-[72%]"
        >
          <span className="absolute inset-[18%] rounded-full border border-[#f5f2ea]/10" />
          <span className="absolute inset-[38%] rounded-full border border-[#f5f2ea]/10" />
          <span className="absolute left-1/2 top-0 h-full w-px bg-[#f5f2ea]/[0.06]" />
          <span className="absolute left-0 top-1/2 h-px w-full bg-[#f5f2ea]/[0.06]" />
        </div>

        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mint/60 bg-mint/10 shadow-[0_0_30px_rgba(89,240,166,0.15)]"
        >
          <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint" />
          <span className="absolute left-1/2 top-1/2 h-px w-20 origin-left -rotate-[28deg] bg-gradient-to-r from-mint/70 to-transparent" />
        </div>

        <div className="absolute inset-0">
          {featuredSignals.map((signal, index) => {
            const position = getRadarPosition(index, featuredSignals.length);

            const opensLeft = position.x > 58;

            return (
              <Link
                aria-label={`${signal.project.name}, signal score ${signal.score.total}`}
                className="group absolute z-10 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
                href={`/projects/${signal.project.slug}`}
                key={signal.project.id}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
              >
                <span className="relative block transition group-hover:-translate-y-0.5 group-hover:scale-105">
                  <ProjectLogo
                    accent={signal.project.accent}
                    className="rounded-full border-[#f5f2ea]/25 ring-4 ring-[#111312]"
                    logoUrl={signal.project.logoUrl}
                    name={signal.project.name}
                    size="sm"
                  />
                  <span className="absolute -right-2 -top-2 min-w-5 rounded-full border border-[#111312] bg-mint px-1 font-mono text-[9px] font-black leading-5 text-[#111312] shadow-sm">
                    {signal.score.total}
                  </span>
                </span>
                <span
                  className={cn(
                    "absolute top-1/2 hidden min-w-0 -translate-y-1/2 items-center gap-1 rounded-md border border-[#f5f2ea]/10 bg-[#111312]/95 px-2.5 py-1.5 shadow-lg backdrop-blur sm:flex",
                    opensLeft ? "right-12 flex-row-reverse" : "left-12",
                  )}
                >
                  <span className="max-w-32 truncate whitespace-nowrap text-[11px] font-black text-[#f5f2ea] lg:max-w-36">
                    {signal.project.name}
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-3 shrink-0 text-[#f5f2ea]/30 transition group-hover:text-mint"
                  />
                </span>
              </Link>
            );
          })}
        </div>

        {remainingSignalCount > 0 ? (
          <Link
            className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 rounded-full border border-[#f5f2ea]/10 bg-[#111312]/90 px-3 py-1.5 text-[10px] font-black uppercase text-mint backdrop-blur hover:border-mint/50"
            href="/projects"
          >
            +{remainingSignalCount} more
            <ArrowUpRight aria-hidden className="size-3" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 border-t border-[#f5f2ea]/10 p-3 sm:grid-cols-[1fr_auto] sm:items-stretch sm:p-4">
        <div className="rounded-lg border border-[#f5f2ea]/10 bg-[#f5f2ea]/[0.06] p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-2 text-mint">
            <Activity aria-hidden className="size-4" />
            <span className="text-xs font-black uppercase">Top signal</span>
          </div>
          <div className="flex items-center gap-3">
            {strongestSignal ? (
              <ProjectLogo
                accent={strongestSignal.project.accent}
                logoUrl={strongestSignal.project.logoUrl}
                name={strongestSignal.project.name}
                size="sm"
              />
            ) : null}
            <p className="text-xl font-black">
              {strongestSignal?.project.name ?? "Awaiting projects"}
            </p>
          </div>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-[#f5f2ea]/55">
            {strongestSignal?.project.lastSignal ?? "No signal indexed yet"}
          </p>
        </div>

        <div className="min-w-32 rounded-lg border border-[#f5f2ea]/10 bg-[#f5f2ea] p-3 text-[#111312] sm:p-4">
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

function getRadarPosition(index: number, total: number) {
  if (total === 1) {
    return { x: 50, y: 25 };
  }

  const outerCount = Math.min(total, 8);
  const isOuter = index < outerCount;
  const ringIndex = isOuter ? index : index - outerCount;
  const ringCount = isOuter ? outerCount : total - outerCount;
  const angleOffset = isOuter ? -100 : -55;
  const angle = angleOffset + (360 / ringCount) * ringIndex;
  const radiusX = isOuter ? 34 : 20;
  const radiusY = isOuter ? 35 : 20;
  const radians = (angle * Math.PI) / 180;

  return {
    x: 50 + Math.cos(radians) * radiusX,
    y: 50 + Math.sin(radians) * radiusY,
  };
}
