import { Activity, CircleDollarSign, Trophy, Users } from "lucide-react";

import { formatCompactNumber } from "@/lib/utils";
import type { Project } from "@/types/project";

export function Leaderboard({ projects }: { projects: Project[] }) {
  const rankedProjects = [...projects].sort(
    (a, b) => b.metrics.tipsUsdc - a.metrics.tipsUsdc,
  );
  const topWeekly = [...projects].sort(
    (a, b) => b.metrics.weeklyTipsUsdc - a.metrics.weeklyTipsUsdc,
  )[0];
  const totalTips = projects.reduce(
    (total, project) => total + project.metrics.tipsUsdc,
    0,
  );
  const totalSupporters = projects.reduce(
    (total, project) => total + project.metrics.supporters,
    0,
  );

  return (
    <section className="bg-ink py-14 text-paper" id="leaderboard">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-mint">
              Tip leaderboard
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Builder signal, ranked by USDC support
            </h2>
          </div>
          <Trophy aria-hidden className="hidden size-10 text-amber sm:block" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-lg border border-paper/10">
            {rankedProjects.map((project, index) => (
              <div
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-paper/10 bg-paper/[0.03] px-4 py-4 last:border-b-0"
                key={project.id}
              >
                <span className="grid size-9 place-items-center rounded-md bg-paper text-sm font-black text-ink">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-black">{project.name}</p>
                  <p className="truncate text-sm font-semibold text-paper/55">
                    {project.category} / {project.builder}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-black">
                    {project.metrics.tipsUsdc}
                  </p>
                  <p className="text-xs font-bold uppercase text-paper/45">
                    USDC
                  </p>
                </div>
              </div>
            ))}
          </div>

          <aside className="grid gap-3">
            <div className="rounded-lg border border-paper/10 bg-paper p-5 text-ink">
              <div className="mb-5 flex items-center justify-between">
                <CircleDollarSign aria-hidden className="size-5 text-forest" />
                <span className="text-xs font-black uppercase text-ink/40">
                  Total
                </span>
              </div>
              <p className="font-mono text-4xl font-black">
                {formatCompactNumber(totalTips)}
              </p>
              <p className="mt-2 text-sm font-bold text-ink/55">USDC tipped</p>
            </div>
            <div className="rounded-lg border border-paper/10 bg-paper/[0.06] p-5">
              <div className="mb-5 flex items-center justify-between">
                <Users aria-hidden className="size-5 text-mint" />
                <span className="text-xs font-black uppercase text-paper/45">
                  Backers
                </span>
              </div>
              <p className="font-mono text-4xl font-black">
                {formatCompactNumber(totalSupporters)}
              </p>
              <p className="mt-2 text-sm font-bold text-paper/55">
                testnet supporters
              </p>
            </div>
            <div className="rounded-lg border border-paper/10 bg-paper/[0.06] p-5">
              <div className="mb-5 flex items-center justify-between">
                <Activity aria-hidden className="size-5 text-amber" />
                <span className="text-xs font-black uppercase text-paper/45">
                  Weekly
                </span>
              </div>
              <p className="text-xl font-black">{topWeekly?.name}</p>
              <p className="mt-2 text-sm font-bold text-paper/55">
                {topWeekly?.metrics.weeklyTipsUsdc} USDC this week
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
