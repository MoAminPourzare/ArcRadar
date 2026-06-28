"use client";

import {
  ChartLineUpIcon as ChartLineUp,
  ClipboardTextIcon as ClipboardText,
  CurrencyCircleDollarIcon as CircleDollarSign,
  MagnifyingGlassIcon as Search,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ArcReadinessAuditPanel } from "@/components/agents/arc-readiness-audit-panel";
import { TipAllocationPanel } from "@/components/agents/tip-allocation-panel";
import { ProjectLogo } from "@/components/projects/project-logo";
import { cn } from "@/lib/utils";
import type { AgentReportSummary } from "@/types/agent";
import type { Project } from "@/types/project";

type AgentWorkspaceProps = {
  initialProjectSlug?: string;
  latestReportsByProjectId?: Record<string, AgentReportSummary>;
  projects: Project[];
};

const agentOptions = [
  {
    description:
      "Paid project audit for profile quality, website health, USDC tipping, Arc proof, and activity signals.",
    icon: ClipboardText,
    id: "arc-readiness",
    label: "Arc Readiness Audit",
    live: true,
    status: "Live",
  },
  {
    description:
      "Paid Arc USDC nanopayment agent that splits a supporter budget across high-signal projects.",
    icon: CircleDollarSign,
    id: "tip-allocation",
    label: "Tip Allocation",
    live: true,
    status: "Live",
  },
] as const;

export function AgentWorkspace({
  initialProjectSlug,
  latestReportsByProjectId = {},
  projects,
}: AgentWorkspaceProps) {
  const [activeAgentId, setActiveAgentId] = useState("arc-readiness");
  const [query, setQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects.find((project) => project.slug === initialProjectSlug)?.id ??
      projects[0]?.id,
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) =>
      [
        project.name,
        project.tagline,
        project.builder,
        project.category,
        ...project.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [projects, query]);
  const visibleProjects = filteredProjects.slice(0, 14);
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ??
    visibleProjects[0] ??
    projects[0];
  const requiresProjectInput = activeAgentId === "arc-readiness";

  return (
    <section className="border-b border-ink/10 bg-paper py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-blueprint">
              Agent console
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-ink sm:text-4xl">
              Run ArcRadar agents without leaving the workspace
            </h1>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-black uppercase text-ink/45 shadow-sm">
            <ChartLineUp aria-hidden className="size-4 text-blueprint" weight="duotone" />
            {projects.length} indexed projects
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {agentOptions.map((agent) => {
            const Icon = agent.icon;
            const isActive = activeAgentId === agent.id;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "min-h-40 rounded-lg border p-4 text-left shadow-sm transition",
                  agent.live
                    ? "bg-white hover:-translate-y-0.5 hover:border-blueprint/35 hover:shadow-md"
                    : "cursor-not-allowed border-dashed bg-white/60 opacity-70",
                  isActive
                    ? "border-blueprint ring-2 ring-blueprint/10"
                    : "border-ink/10",
                )}
                disabled={!agent.live}
                key={agent.id}
                onClick={() => setActiveAgentId(agent.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-lg",
                      agent.live
                        ? "bg-mint/20 text-forest"
                        : "bg-ink/5 text-ink/35",
                    )}
                  >
                    <Icon aria-hidden className="size-6" weight="duotone" />
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-[10px] font-black uppercase",
                      agent.live
                        ? "bg-blueprint/10 text-blueprint"
                        : "bg-ink/5 text-ink/35",
                    )}
                  >
                    {agent.status}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-black text-ink">
                  {agent.label}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">
                  {agent.description}
                </p>
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            "mt-5 grid gap-5",
            requiresProjectInput
              ? "xl:grid-cols-[390px_minmax(0,1fr)]"
              : "xl:grid-cols-1",
          )}
        >
          {requiresProjectInput ? (
            <aside className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-blueprint">
                    Project input
                  </p>
                  <h2 className="mt-1 text-xl font-black text-ink">
                    Choose target project
                  </h2>
                </div>
                <span className="rounded-md bg-ink/5 px-2 py-1 text-[10px] font-black uppercase text-ink/40">
                  Required
                </span>
              </div>

              <label className="relative mt-4 block">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/35"
                  weight="duotone"
                />
                <input
                  className="min-h-11 w-full rounded-lg border border-ink/10 bg-paper pl-10 pr-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/35 focus:border-blueprint"
                  onChange={(event) => {
                    const value = event.target.value;
                    setQuery(value);

                    const nextProject = projects.find((project) =>
                      [
                        project.name,
                        project.tagline,
                        project.builder,
                        project.category,
                        ...project.tags,
                      ]
                        .join(" ")
                        .toLowerCase()
                        .includes(value.trim().toLowerCase()),
                    );

                    if (nextProject && value.trim()) {
                      setSelectedProjectId(nextProject.id);
                    }
                  }}
                  placeholder="Search project, builder, category"
                  type="search"
                  value={query}
                />
              </label>

              <div className="mt-3 grid max-h-[540px] gap-2 overflow-y-auto pr-1">
                {visibleProjects.length > 0 ? (
                  visibleProjects.map((project) => (
                    <ProjectOption
                      active={project.id === selectedProject?.id}
                      key={project.id}
                      project={project}
                      report={latestReportsByProjectId[project.id]}
                      onSelect={() => setSelectedProjectId(project.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-ink/20 bg-paper p-4 text-sm font-semibold text-ink/50">
                    No project found for this search.
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs font-semibold text-ink/40">
                Showing {visibleProjects.length} of {filteredProjects.length} matches.
              </p>
            </aside>
          ) : null}

          <div className="grid gap-4">
            {activeAgentId === "tip-allocation" ? (
              <TipAllocationPanel />
            ) : selectedProject ? (
              <>
                <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <ProjectLogo
                        accent={selectedProject.accent}
                        logoUrl={selectedProject.logoUrl}
                        name={selectedProject.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-blueprint">
                          Selected target
                        </p>
                        <h2 className="truncate text-2xl font-black text-ink">
                          {selectedProject.name}
                        </h2>
                        <p className="text-sm font-semibold text-ink/50">
                          {selectedProject.category}
                        </p>
                      </div>
                    </div>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ink/10 bg-paper px-3 text-xs font-black uppercase text-ink/55 transition hover:border-blueprint/35 hover:text-blueprint"
                      href={`/projects/${selectedProject.slug}`}
                    >
                      Open profile
                    </Link>
                  </div>
                </section>

                <ArcReadinessAuditPanel
                  initialReport={latestReportsByProjectId[selectedProject.id]}
                  key={selectedProject.id}
                  projectName={selectedProject.name}
                  projectSlug={selectedProject.slug}
                />
              </>
            ) : (
              <section className="grid min-h-80 place-items-center rounded-lg border border-dashed border-ink/20 bg-white p-8 text-center shadow-sm">
                <div>
                  <p className="text-xl font-black text-ink">
                    Select a project
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink/50">
                    Pick an indexed Arc project before running the agent.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectOption({
  active,
  onSelect,
  project,
  report,
}: {
  active: boolean;
  onSelect: () => void;
  project: Project;
  report?: AgentReportSummary;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3 text-left transition",
        active
          ? "border-blueprint bg-blueprint/5"
          : "border-ink/10 bg-paper hover:border-ink/25",
      )}
      onClick={onSelect}
      type="button"
    >
      <ProjectLogo
        accent={project.accent}
        logoUrl={project.logoUrl}
        name={project.name}
        size="sm"
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-ink">
          {project.name}
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-ink/45">
          {project.category} / {project.builder}
        </span>
      </span>
      <span
        className={cn(
          "grid size-9 place-items-center rounded-md border font-mono text-xs font-black",
          report
            ? "border-mint/30 bg-mint/15 text-forest"
            : "border-ink/10 bg-white text-ink/35",
        )}
      >
        {report?.score ?? "-"}
      </span>
    </button>
  );
}
