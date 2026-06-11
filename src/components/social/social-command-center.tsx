import {
  MessageSquareQuote,
  Radio,
  Rocket,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { cn, formatCompactNumber, shortenAddress } from "@/lib/utils";
import type { EcosystemActivityItem, SocialLayerData } from "@/types/social";

type SocialCommandCenterProps = {
  data: SocialLayerData;
};

const activityTone: Record<EcosystemActivityItem["type"], string> = {
  curation: "bg-amber text-ink",
  tip: "bg-blueprint text-paper",
};

export function SocialCommandCenter({ data }: SocialCommandCenterProps) {
  const topSignals = data.projects.slice(0, 6);

  return (
    <section className="border-y border-ink/10 bg-white py-12" id="signals">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 inline-flex min-h-8 items-center gap-2 rounded-md border border-mint/30 bg-mint/20 px-2.5 text-xs font-black uppercase text-forest">
              <Sparkles aria-hidden className="size-3.5" />
              Signal layer
            </div>
            <p className="text-sm font-black uppercase text-blueprint">
              Automatic project signals
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-black text-ink sm:text-4xl">
              Project momentum without artificial verification labels
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-ink/55">
              ArcRadar combines indexed tips, weekly velocity, public links,
              and profile quality into one score from 0 to 100.
            </p>
          </div>

          <div className="lg:min-w-[150px]">
            <MiniStat
              label="Tip messages"
              value={formatCompactNumber(data.stats.tipMessageCount)}
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid content-start gap-4">
            <section className="rounded-lg border border-ink/10 bg-ink p-5 text-paper">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-paper/45">
                    Signal score
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Top projects</h2>
                </div>
                <Trophy aria-hidden className="size-5 text-amber" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {topSignals.map((signal, index) => (
                  <Link
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-paper/10 bg-paper/[0.05] p-3 transition hover:border-mint/50"
                    href={`/projects/${signal.project.slug}`}
                    key={signal.project.id}
                  >
                    <span className="grid size-8 place-items-center rounded-md bg-paper text-xs font-black text-ink">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-black">
                        {signal.project.name}
                      </span>
                      <span className="block truncate text-xs font-bold text-paper/45">
                        {signal.project.category}
                      </span>
                    </span>
                    <span className="font-mono text-lg font-black text-mint">
                      {signal.score.total}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-ink/10 bg-paper p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-ink/40">
                    Hackathon mode
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-ink">
                    Build tracks with ready-made primitives
                  </h2>
                </div>
                <Rocket aria-hidden className="size-6 text-blueprint" />
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                {data.hackathonTracks.map((track) => (
                  <div
                    className="rounded-lg border border-ink/10 bg-white p-4"
                    key={track.id}
                  >
                    <p className="font-black text-ink">{track.title}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">
                      {track.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {track.projectSlugs.map((slug) => {
                        const signal = data.projects.find(
                          (item) => item.project.slug === slug,
                        );

                        if (!signal) {
                          return null;
                        }

                        return (
                          <Link
                            className="rounded-md bg-ink/5 px-2 py-1 text-xs font-black text-ink/60 transition hover:bg-ink hover:text-paper"
                            href={`/projects/${slug}`}
                            key={slug}
                          >
                            {signal.project.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <ActivityFeed items={data.activityFeed} />
        </div>
      </div>
    </section>
  );
}

function ActivityFeed({ items }: { items: EcosystemActivityItem[] }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-ink/40">
            Ecosystem activity
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">Latest signals</h2>
        </div>
        <Radio aria-hidden className="size-5 text-forest" />
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <Link
            className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-ink/10 bg-paper p-3 transition hover:border-blueprint/40"
            href={item.href}
            key={item.id}
          >
            <span
              className={cn(
                "mt-0.5 grid size-8 place-items-center rounded-md",
                activityTone[item.type],
              )}
            >
              {item.type === "tip" ? (
                <Zap aria-hidden className="size-4" />
              ) : (
                <MessageSquareQuote aria-hidden className="size-4" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-ink">
                {item.type === "tip" && item.walletAddress
                  ? `${shortenAddress(item.walletAddress)} tipped ${
                      item.amountUsdc
                    } USDC to ${item.projectName}`
                  : item.projectName}
              </span>
              <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-5 text-ink/55">
                {item.message}
              </span>
              <span className="mt-2 block font-mono text-[11px] font-black uppercase text-ink/35">
                {item.timestamp}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3 text-right shadow-sm">
      <p className="font-mono text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-ink/40">
        {label}
      </p>
    </div>
  );
}
