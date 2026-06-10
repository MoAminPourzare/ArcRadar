import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BadgeDollarSign,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  Gauge,
  Layers3,
  MessageSquareQuote,
  PanelsTopLeft,
  Radio,
  ReceiptText,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Trophy,
  Wallet,
  WalletCards,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { ProjectCard } from "@/components/projects/project-card";
import { arcLinks } from "@/config/arc";
import { cn, shortenAddress } from "@/lib/utils";
import type {
  Project,
  ProjectMilestoneStatus,
  ProjectTipData,
} from "@/types/project";
import type {
  ProjectSocialBadge,
  ProjectSocialSignal,
  SocialLayerData,
} from "@/types/social";

type ProjectProfilePageProps = {
  project: Project;
  relatedProjects: Project[];
  socialData: SocialLayerData;
  socialSignal?: ProjectSocialSignal;
  tipData: ProjectTipData;
};

const accentClass: Record<Project["accent"], string> = {
  amber: "bg-amber text-ink",
  blueprint: "bg-blueprint text-paper",
  coral: "bg-coral text-paper",
  cyan: "bg-cyan text-ink",
  mint: "bg-mint text-ink",
};

const milestoneIcon: Record<ProjectMilestoneStatus, typeof CheckCircle2> = {
  building: Clock3,
  done: CheckCircle2,
  planned: Circle,
};

const milestoneClass: Record<ProjectMilestoneStatus, string> = {
  building: "border-amber/40 bg-amber/15 text-ink",
  done: "border-forest/25 bg-mint/20 text-forest",
  planned: "border-ink/10 bg-white text-ink/55",
};

const badgeToneClass: Record<ProjectSocialBadge["tone"], string> = {
  amber: "bg-amber/20 text-ink",
  blueprint: "bg-blueprint/10 text-blueprint",
  coral: "bg-coral/15 text-coral",
  cyan: "bg-cyan/20 text-blueprint",
  forest: "bg-mint/20 text-forest",
  ink: "bg-ink/10 text-ink",
  mint: "bg-mint/25 text-forest",
};

const claimStatusLabel: Record<ProjectSocialSignal["claimStatus"], string> = {
  "claim-ready": "Claim ready",
  unclaimed: "Unclaimed",
  verified: "Verified builder",
};

export function ProjectProfilePage({
  project,
  relatedProjects,
  socialData,
  socialSignal,
  tipData,
}: ProjectProfilePageProps) {
  const primaryLink = project.links[0];
  const explorerAddressUrl = `${arcLinks.explorer}/address/${project.walletAddress}`;
  const collections = socialSignal
    ? socialData.collections.filter((collection) =>
        socialSignal.collections.includes(collection.id),
      )
    : [];
  const signalScore = socialSignal?.score.total ?? project.metrics.signalScore;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-ink/10 bg-paper">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#111312_1px,transparent_1px),linear-gradient(90deg,#111312_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            className="mb-6 inline-flex items-center gap-2 text-sm font-black text-ink/60 transition hover:text-ink"
            href="/#projects"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to directory
          </Link>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-[360px] rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "grid size-16 place-items-center rounded-lg text-2xl font-black",
                      accentClass[project.accent],
                    )}
                  >
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-md bg-cyan/15 px-2.5 text-xs font-black uppercase text-blueprint">
                        <Radio aria-hidden className="size-3" />
                        {project.status}
                      </span>
                      <span className="inline-flex min-h-7 items-center rounded-md bg-ink/5 px-2.5 text-xs font-black uppercase text-ink/55">
                        {project.stage}
                      </span>
                      {socialSignal?.claimStatus === "verified" ? (
                        <span className="inline-flex min-h-7 items-center gap-1.5 rounded-md bg-mint/20 px-2.5 text-xs font-black uppercase text-forest">
                          <BadgeCheck aria-hidden className="size-3" />
                          Verified builder
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-black uppercase text-blueprint">
                      {project.category}
                    </p>
                    <h1 className="mt-2 text-4xl font-black leading-tight text-ink sm:text-5xl">
                      {project.name}
                    </h1>
                  </div>
                </div>
              </div>

              <p className="max-w-3xl text-xl font-black leading-8 text-ink">
                {project.tagline}
              </p>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/60">
                {project.description}
              </p>

              {socialSignal?.badges.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {socialSignal.badges.map((badge) => (
                    <span
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-black uppercase",
                        badgeToneClass[badge.tone],
                      )}
                      key={badge.label}
                      title={badge.description}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    className="rounded-md bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/60"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  className="btn-primary min-h-12"
                  href={explorerAddressUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  View tip wallet
                  <ArrowUpRight aria-hidden className="size-4" />
                </a>
                {primaryLink ? (
                  <a
                    className="btn-secondary min-h-12"
                    href={primaryLink.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open {primaryLink.label}
                    <ExternalLink aria-hidden className="size-4" />
                  </a>
                ) : null}
              </div>
            </div>

            <aside className="grid gap-3">
              <MetricPanel
                icon={Gauge}
                label="Signal score"
                value={signalScore.toString()}
                supporting={
                  socialSignal
                    ? `Tip ${socialSignal.score.tip} / Social ${socialSignal.score.social}`
                    : `Rank #${project.metrics.rank}`
                }
              />
              <MetricPanel
                icon={BadgeDollarSign}
                label="Total tips"
                value={`${project.metrics.tipsUsdc} USDC`}
                supporting={`${project.metrics.weeklyTipsUsdc} USDC this week`}
              />
              <MetricPanel
                icon={Wallet}
                label="Tip target"
                value={shortenAddress(project.walletAddress)}
                supporting="Arc Testnet USDC"
              />
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="grid gap-6">
          {socialSignal ? (
            <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-blueprint">
                    Signal DNA
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-ink">
                    Why this project is ranking
                  </h2>
                </div>
                <Sparkles aria-hidden className="size-5 text-blueprint" />
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <SignalPillar label="Tip" value={socialSignal.score.tip} />
                <SignalPillar
                  label="Velocity"
                  value={socialSignal.score.velocity}
                />
                <SignalPillar
                  label="Freshness"
                  value={socialSignal.score.freshness}
                />
                <SignalPillar
                  label="Social"
                  value={socialSignal.score.social}
                />
                <SignalPillar
                  label="Curation"
                  value={socialSignal.score.curation}
                />
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <NarrativeCard
              icon={ShieldCheck}
              label="Problem"
              text={project.profile.problem}
            />
            <NarrativeCard
              icon={Layers3}
              label="Solution"
              text={project.profile.solution}
            />
            <NarrativeCard
              icon={BadgeDollarSign}
              label="Why Arc"
              text={project.profile.whyArc}
            />
          </div>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <MessageSquareQuote aria-hidden className="size-5 text-blueprint" />
              <span className="text-xs font-black uppercase text-ink/40">
                Builder note
              </span>
            </div>
            <p className="text-base font-black leading-7 text-ink">
              {project.profile.builderNote}
            </p>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-blueprint">
                  Roadmap
                </p>
                <h2 className="mt-1 text-2xl font-black text-ink">
                  Build path
                </h2>
              </div>
              <span className="rounded-md bg-ink/5 px-2.5 py-1 text-xs font-black uppercase text-ink/45">
                {project.metrics.launches} launches
              </span>
            </div>
            <div className="grid gap-3">
              {project.profile.roadmap.map((milestone) => {
                const Icon = milestoneIcon[milestone.status];

                return (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3",
                      milestoneClass[milestone.status],
                    )}
                    key={milestone.label}
                  >
                    <Icon aria-hidden className="size-5 shrink-0" />
                    <span className="font-bold">{milestone.label}</span>
                    <span className="ml-auto text-xs font-black uppercase">
                      {milestone.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase text-blueprint">
              Tip message wall
            </p>
            <h2 className="mt-1 text-2xl font-black text-ink">
              Shoutouts from supporters
            </h2>
            <div className="mt-5 grid gap-3">
              {tipData.latestTips.length > 0 ? (
                tipData.latestTips.map((tip) => (
                  <div
                    className="grid gap-3 rounded-lg border border-ink/10 bg-paper p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center"
                    key={tip.id}
                  >
                    <div>
                      <span className="block font-mono text-lg font-black text-ink">
                        {tip.amountUsdc} USDC
                      </span>
                      <span className="block text-xs font-black uppercase text-ink/40">
                        {tip.timestamp}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-ink">
                        {shortenAddress(tip.tipperAddress)}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-ink/55">
                        {tip.message}
                      </p>
                    </div>
                    <a
                      aria-label="Open tip transaction"
                      className="grid size-9 place-items-center rounded-lg bg-white text-ink transition hover:bg-ink hover:text-paper"
                      href={`${arcLinks.explorer}/tx/${tip.transactionHash}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ReceiptText aria-hidden className="size-4" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-ink/20 bg-paper p-5 text-sm font-semibold text-ink/55">
                  No tips indexed yet. Tip activity will appear here after the
                  Arc Testnet tipping flow is live.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase text-blueprint">
              Activity
            </p>
            <h2 className="mt-1 text-2xl font-black text-ink">
              Latest signals
            </h2>
            <div className="mt-5 grid gap-3">
              {project.activity.map((item) => (
                <div
                  className="grid gap-2 rounded-lg border border-ink/10 bg-paper p-4 sm:grid-cols-[140px_1fr]"
                  key={`${item.timestamp}-${item.label}`}
                >
                  <span className="font-mono text-xs font-black text-ink/45">
                    {item.timestamp}
                  </span>
                  <div>
                    <p className="font-black text-ink">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-ink/55">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-4">
          {socialSignal ? (
            <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <ShieldQuestion aria-hidden className="size-5 text-blueprint" />
                <span className="text-xs font-black uppercase text-ink/40">
                  Builder claim
                </span>
              </div>
              <h2 className="text-2xl font-black text-ink">
                {claimStatusLabel[socialSignal.claimStatus]}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-ink/55">
                {socialSignal.claimStatus === "verified"
                  ? "This builder has enough curated public proof to display the verified badge."
                  : "The profile has a tip wallet and is prepared for future wallet-based claim checks."}
              </p>
              <Link className="btn-secondary mt-4 w-full" href="/#wallet">
                Wallet claim prep
                <WalletCards aria-hidden className="size-4" />
              </Link>
            </section>
          ) : null}

          {collections.length > 0 ? (
            <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <PanelsTopLeft aria-hidden className="size-5 text-blueprint" />
                <span className="text-xs font-black uppercase text-ink/40">
                  Collections
                </span>
              </div>
              <div className="grid gap-2">
                {collections.map((collection) => (
                  <Link
                    className="rounded-lg border border-ink/10 bg-paper p-3 transition hover:border-blueprint/40"
                    href="/#signals"
                    key={collection.id}
                  >
                    <p className="font-black text-ink">{collection.title}</p>
                    <p className="mt-1 text-xs font-bold uppercase text-ink/40">
                      {collection.track}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {socialSignal?.shoutouts.length ? (
            <section className="rounded-lg border border-ink/10 bg-ink p-5 text-paper shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <MessageSquareQuote aria-hidden className="size-5 text-mint" />
                <span className="text-xs font-black uppercase text-paper/40">
                  Shoutouts
                </span>
              </div>
              <div className="grid gap-2">
                {socialSignal.shoutouts.slice(0, 3).map((shoutout) => (
                  <a
                    className="rounded-lg border border-paper/10 bg-paper/[0.06] p-3 transition hover:border-mint/50"
                    href={`${arcLinks.explorer}/tx/${shoutout.transactionHash}`}
                    key={shoutout.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-black text-mint">
                        {shortenAddress(shoutout.tipperAddress)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-paper">
                        <Zap aria-hidden className="size-3" />
                        {shoutout.amountUsdc} USDC
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-6 text-paper/65">
                      {shoutout.message}
                    </p>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Trophy aria-hidden className="size-5 text-amber" />
              <span className="text-xs font-black uppercase text-ink/40">
                Supporter board
              </span>
            </div>
            <div className="grid gap-2">
              {tipData.leaderboard.length > 0 ? (
                tipData.leaderboard.map((rank, index) => (
                  <div
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-ink/10 bg-paper p-3"
                    key={rank.address}
                  >
                    <span className="grid size-8 place-items-center rounded-md bg-ink text-xs font-black text-paper">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-black text-ink">
                        {shortenAddress(rank.address)}
                      </p>
                      <p className="text-xs font-bold text-ink/45">
                        {rank.tipCount} tips
                      </p>
                    </div>
                    <span className="font-mono text-sm font-black text-forest">
                      {rank.totalUsdc} USDC
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-ink/20 bg-paper p-3 text-sm font-semibold text-ink/55">
                  No supporters indexed yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase text-blueprint">
              Builder
            </p>
            <h2 className="mt-1 text-2xl font-black text-ink">
              {project.builder}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/55">
              {project.lastSignal}
            </p>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase text-blueprint">
              Good fit for
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.profile.idealFor.map((item) => (
                <span
                  className="rounded-md bg-mint/20 px-2.5 py-1 text-xs font-black text-forest"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase text-blueprint">
              Curation notes
            </p>
            <ul className="mt-4 grid gap-3">
              {project.profile.curationNotes.map((note) => (
                <li
                  className="rounded-lg border border-ink/10 bg-paper p-3 text-sm font-semibold leading-6 text-ink/60"
                  key={note}
                >
                  {note}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase text-blueprint">
              Links
            </p>
            <div className="mt-4 grid gap-2">
              {project.links.map((link) => (
                <a
                  className="flex min-h-11 items-center justify-between rounded-lg border border-ink/10 bg-paper px-3 text-sm font-black text-ink transition hover:border-ink/30"
                  href={link.href}
                  key={`${link.label}-${link.href}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label}
                  <ArrowUpRight aria-hidden className="size-4" />
                </a>
              ))}
            </div>
          </section>
        </aside>
      </section>

      {relatedProjects.length > 0 ? (
        <section className="border-t border-ink/10 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase text-blueprint">
              Related signal
            </p>
            <h2 className="mt-2 text-3xl font-black text-ink">
              Nearby projects
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedProjects.map((relatedProject) => (
                <ProjectCard key={relatedProject.id} project={relatedProject} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function MetricPanel({
  icon: Icon,
  label,
  supporting,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  supporting: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <Icon aria-hidden className="size-5 text-blueprint" />
        <span className="text-xs font-black uppercase text-ink/40">
          {label}
        </span>
      </div>
      <p className="break-words font-mono text-3xl font-black text-ink">
        {value}
      </p>
      <p className="mt-2 text-sm font-bold text-ink/55">{supporting}</p>
    </div>
  );
}

function SignalPillar({ label, value }: { label: string; value: number }) {
  const height = `${Math.max(16, Math.min(100, value * 4))}%`;

  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-3">
      <div className="flex min-h-24 items-end rounded-md bg-white p-2">
        <span
          className="w-full rounded-sm bg-blueprint"
          style={{ height }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase text-ink/40">
          {label}
        </span>
        <span className="font-mono text-sm font-black text-ink">{value}</span>
      </div>
    </div>
  );
}

function NarrativeCard({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof ShieldCheck;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <Icon aria-hidden className="size-5 text-blueprint" />
        <span className="text-xs font-black uppercase text-ink/40">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold leading-6 text-ink/65">{text}</p>
    </div>
  );
}
