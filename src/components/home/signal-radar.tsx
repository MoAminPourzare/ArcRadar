import { Activity, Crosshair, Radio, ScanLine } from "lucide-react";

import type { Project } from "@/types/project";
import type { ProjectSocialSignal } from "@/types/social";

const accentClass: Record<Project["accent"], string> = {
  amber: "bg-amber text-ink",
  blueprint: "bg-blueprint text-paper",
  coral: "bg-coral text-paper",
  cyan: "bg-cyan text-ink",
  mint: "bg-mint text-ink",
};

const nodePositions = [
  { left: "28%", top: "30%" },
  { left: "62%", top: "24%" },
  { left: "74%", top: "58%" },
  { left: "42%", top: "68%" },
  { left: "18%", top: "58%" },
  { left: "52%", top: "45%" },
];

export function SignalRadar({ signals }: { signals: ProjectSocialSignal[] }) {
  const rankedSignals = [...signals].sort(
    (a, b) => b.score.total - a.score.total,
  );
  const featuredSignals = rankedSignals.slice(0, 6);
  const strongestSignal = rankedSignals[0];

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-lg bg-ink text-paper shadow-sm">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#f5f2ea_1px,transparent_1px),linear-gradient(90deg,#f5f2ea_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper/10" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper/10" />
      <div className="absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper/10" />
      <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-paper/10" />
      <div className="absolute left-1/2 top-1/2 h-full w-px -translate-y-1/2 bg-paper/10" />

      <div className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border border-mint/50 bg-ink text-mint">
        <Crosshair aria-hidden className="size-7" />
      </div>

      {featuredSignals.map((signal, index) => (
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
          key={signal.project.id}
          style={nodePositions[index]}
        >
          <span
            className={`grid size-8 rotate-45 place-items-center rounded-md ${accentClass[signal.project.accent]}`}
          >
            <span className="-rotate-45 font-mono text-xs font-black">
              {index + 1}
            </span>
          </span>
          <span className="hidden rounded-md border border-paper/10 bg-ink/80 px-2 py-1 text-xs font-black text-paper shadow-sm backdrop-blur sm:block">
            {signal.project.name}
          </span>
        </div>
      ))}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-paper/10 bg-ink/70 px-4 py-3 backdrop-blur">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase text-mint">
          <Radio aria-hidden className="size-4" />
          Live signal map
        </span>
        <span className="font-mono text-xs font-black text-paper/55">
          ARC / TESTNET
        </span>
      </div>

      <div className="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="rounded-lg border border-paper/10 bg-paper/[0.06] p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-mint">
            <Activity aria-hidden className="size-4" />
            <span className="text-xs font-black uppercase">Top signal</span>
          </div>
          <p className="text-xl font-black">
            {strongestSignal?.project.name ?? "Awaiting projects"}
          </p>
          <p className="mt-1 text-sm font-semibold text-paper/55">
            {strongestSignal?.project.lastSignal ?? "No signal indexed yet"}
          </p>
        </div>

        <div className="rounded-lg border border-paper/10 bg-paper p-4 text-ink">
          <span className="flex items-center gap-2 text-xs font-black uppercase text-ink/45">
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
