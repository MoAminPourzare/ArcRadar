import { ArrowRight, Database, Fuel, Radar, Sparkles } from "lucide-react";

import { SignalRadar } from "@/components/home/signal-radar";
import { arcLinks, arcTestnet } from "@/config/arc";
import { formatCompactNumber } from "@/lib/utils";
import type { Project } from "@/types/project";

type HeroSectionProps = {
  projects: Project[];
};

export function HeroSection({ projects }: HeroSectionProps) {
  const totalTips = projects.reduce(
    (total, project) => total + project.metrics.tipsUsdc,
    0,
  );
  const weeklyTips = projects.reduce(
    (total, project) => total + project.metrics.weeklyTipsUsdc,
    0,
  );
  const totalSupporters = projects.reduce(
    (total, project) => total + project.metrics.supporters,
    0,
  );
  const heroStats = [
    {
      icon: Database,
      label: "Tracked",
      value: projects.length.toString(),
    },
    {
      icon: Sparkles,
      label: "Testnet tips",
      value: `${formatCompactNumber(totalTips)} USDC`,
    },
    {
      icon: Fuel,
      label: "Weekly flow",
      value: `${formatCompactNumber(weeklyTips)} USDC`,
    },
    {
      icon: Radar,
      label: "Supporters",
      value: formatCompactNumber(totalSupporters),
    },
  ];

  return (
    <section className="relative overflow-hidden border-b border-ink/10 bg-paper">
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#111312_1px,transparent_1px),linear-gradient(90deg,#111312_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-8 lg:py-12">
        <div className="flex min-h-[460px] flex-col justify-between">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-black text-forest shadow-sm">
                <Radar aria-hidden className="size-4" />
                Arc Testnet
              </span>
              <span className="inline-flex min-h-9 items-center rounded-lg border border-ink/10 bg-white px-3 font-mono text-sm font-black text-ink/65 shadow-sm">
                Chain {arcTestnet.id}
              </span>
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
              ArcRadar
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-ink/65">
              A curated signal board for Arc builders, testnet projects, USDC
              support, and the apps gaining momentum across the new Circle L1.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a className="btn-primary min-h-12" href="#projects">
                Explore projects
                <ArrowRight aria-hidden className="size-4" />
              </a>
              <a
                className="btn-secondary min-h-12"
                href={arcLinks.faucet}
                rel="noreferrer"
                target="_blank"
              >
                Get testnet USDC
                <ArrowRight aria-hidden className="size-4" />
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  className="min-h-28 rounded-lg border border-ink/10 bg-white p-4 shadow-sm"
                  key={stat.label}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Icon aria-hidden className="size-5 text-blueprint" />
                    <span className="h-2 w-8 rounded-sm bg-mint" />
                  </div>
                  <p className="font-mono text-2xl font-black">{stat.value}</p>
                  <p className="mt-1 text-xs font-black uppercase text-ink/40">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <SignalRadar projects={projects} />
      </div>
    </section>
  );
}
