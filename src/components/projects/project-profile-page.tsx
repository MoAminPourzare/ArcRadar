import {
  AtSign,
  ArrowLeft,
  BadgeDollarSign,
  Code2,
  ExternalLink,
  Gauge,
  Globe2,
  Info,
  Layers3,
  MessagesSquare,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { ProjectCard } from "@/components/projects/project-card";
import { ProjectTipPanel } from "@/components/projects/project-tip-panel";
import { cn, shortenAddress } from "@/lib/utils";
import type { Project, ProjectLink, ProjectTipData } from "@/types/project";
import type { ProjectSocialSignal } from "@/types/social";

type ProjectProfilePageProps = {
  project: Project;
  relatedProjects: Project[];
  socialSignal?: ProjectSocialSignal;
  tipData: ProjectTipData;
};

const accentClass: Record<Project["accent"], string> = {
  amber: "bg-amber text-accent-ink",
  blueprint: "bg-blueprint text-paper",
  coral: "bg-coral text-paper",
  cyan: "bg-cyan text-accent-ink",
  mint: "bg-mint text-accent-ink",
};

const officialLinkMeta: Record<
  ProjectLink["label"],
  { description: string; icon: typeof Globe2 }
> = {
  "Builder X": {
    description: "Builder profile",
    icon: UserRound,
  },
  Discord: {
    description: "Community server",
    icon: MessagesSquare,
  },
  GitHub: {
    description: "Project source",
    icon: Code2,
  },
  "Project X": {
    description: "Project updates",
    icon: AtSign,
  },
  Website: {
    description: "Official website",
    icon: Globe2,
  },
};

const signalPillars = {
  curation: {
    description:
      "How complete and useful the public project profile is: problem, solution, Arc relevance, description, tags, and builder context.",
    label: "Curation",
    max: 25,
  },
  social: {
    description:
      "Official public links available for the project: website, project or builder X, Discord, and GitHub.",
    label: "Social",
    max: 15,
  },
  tip: {
    description:
      "The project's indexed USDC tip total compared with the most-tipped project currently in ArcRadar.",
    label: "Tip",
    max: 35,
  },
  velocity: {
    description:
      "The project's indexed USDC tips during the last seven days compared with the fastest-moving project.",
    label: "Velocity",
    max: 25,
  },
} as const;

export function ProjectProfilePage({
  project,
  relatedProjects,
  socialSignal,
  tipData,
}: ProjectProfilePageProps) {
  const signalScore = socialSignal?.score.total ?? 0;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-ink/10 bg-paper">
        <div className="radar-grid absolute inset-0 opacity-[0.08] [background-size:44px_44px]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            className="mb-6 inline-flex items-center gap-2 text-sm font-black text-ink/60 transition hover:text-ink"
            href="/projects"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to directory
          </Link>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "grid size-16 shrink-0 place-items-center rounded-lg text-2xl font-black",
                    accentClass[project.accent],
                  )}
                >
                  {project.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black uppercase text-blueprint">
                      {project.category}
                    </span>
                  </div>
                  <h1 className="mt-2 text-4xl font-black leading-tight text-ink sm:text-5xl">
                    {project.name}
                  </h1>
                </div>
              </div>

              <p className="mt-8 max-w-3xl text-xl font-black leading-8 text-ink">
                {project.tagline}
              </p>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-ink/60">
                {project.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    className="rounded-md bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/60"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {project.links.length > 0 ? (
                <div className="mt-7 border-t border-ink/10 pt-5">
                  <p className="text-xs font-black uppercase tracking-wide text-ink/40">
                    Official links
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {project.links.map((link) => (
                      <OfficialLink link={link} key={link.label} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="grid content-start gap-3">
              <div className="grid grid-cols-2 gap-3">
                <MetricPanel
                  icon={Gauge}
                  label="Signal"
                  supporting="Automatic / 100"
                  value={signalScore.toString()}
                />
                <MetricPanel
                  icon={BadgeDollarSign}
                  label="Total tips"
                  supporting={`${formatUsdc(tipData.weeklyUsdc)} this week`}
                  value={formatUsdc(tipData.totalUsdc)}
                />
              </div>
              <ProjectTipPanel
                projectName={project.name}
                projectSlug={project.slug}
                projectWallet={project.walletAddress}
              />
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="grid content-start gap-6">
          {socialSignal ? (
            <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-blueprint">
                    Signal DNA
                  </p>
                  <h2 className="mt-1 text-xl font-black text-ink">
                    Score breakdown
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <SignalPillar
                    {...signalPillars.tip}
                    value={socialSignal.score.tip}
                  />
                  <SignalPillar
                    {...signalPillars.velocity}
                    value={socialSignal.score.velocity}
                  />
                  <SignalPillar
                    {...signalPillars.social}
                    value={socialSignal.score.social}
                  />
                  <SignalPillar
                    {...signalPillars.curation}
                    value={socialSignal.score.curation}
                  />
                </div>
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
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Trophy aria-hidden className="size-5 text-amber" />
              <span className="text-xs font-black uppercase text-ink/40">
                Tipper board
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
                        {rank.tipCount} {rank.tipCount === 1 ? "tip" : "tips"}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-black text-forest">
                      {formatUsdc(rank.totalUsdc)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-ink/20 bg-paper p-4 text-sm font-semibold leading-6 text-ink/55">
                  No indexed tips yet. Real tipper addresses and amounts will
                  appear here after the tipping integration is live.
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>

      {relatedProjects.length > 0 ? (
        <section className="border-t border-ink/10 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase text-blueprint">
              Related projects
            </p>
            <h2 className="mt-2 text-3xl font-black text-ink">
              Explore similar ideas
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

function OfficialLink({ link }: { link: ProjectLink }) {
  const { description, icon: Icon } = officialLinkMeta[link.label];

  return (
    <a
      className="group flex min-h-16 items-center gap-3 rounded-lg border border-ink/10 bg-paper px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-blueprint/35 hover:bg-blueprint/[0.04] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueprint/40"
      href={link.href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-blueprint shadow-sm transition group-hover:bg-blueprint group-hover:text-paper">
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-ink">{link.label}</span>
        <span className="mt-0.5 block text-xs font-semibold text-ink/45">
          {description}
        </span>
      </span>
      <ExternalLink
        aria-hidden
        className="size-3.5 shrink-0 text-ink/25 transition group-hover:text-blueprint"
      />
    </a>
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
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Icon aria-hidden className="size-4 text-blueprint" />
        <span className="text-[10px] font-black uppercase text-ink/40">
          {label}
        </span>
      </div>
      <p className="mt-4 break-words font-mono text-2xl font-black text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs font-bold text-ink/50">{supporting}</p>
    </div>
  );
}

function SignalPillar({
  description,
  label,
  max,
  value,
}: {
  description: string;
  label: string;
  max: number;
  value: number;
}) {
  const percentage = `${Math.round((value / max) * 100)}%`;

  return (
    <div
      className="group relative min-w-28 rounded-lg border border-ink/10 bg-paper px-3 py-2 outline-none focus:border-blueprint"
      tabIndex={0}
      title={description}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase text-ink/45">
          {label}
        </span>
        <Info aria-hidden className="size-3 text-ink/35" />
      </div>
      <p className="mt-1 font-mono text-sm font-black text-ink">
        {value} / {max}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-blueprint"
          style={{ width: percentage }}
        />
      </div>
      <div
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 hidden w-64 -translate-x-1/2 rounded-lg bg-ink p-3 text-xs font-semibold leading-5 text-paper shadow-lg group-hover:block group-focus:block"
        role="tooltip"
      >
        {description}
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

function formatUsdc(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)} USDC`;
}
