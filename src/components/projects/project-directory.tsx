"use client";

import {
  MagnifyingGlassIcon as Search,
  PlusIcon as Plus,
  SlidersHorizontalIcon as SlidersHorizontal,
  XIcon as X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/projects/project-card";
import { projectCategories } from "@/data/projects";
import { cn } from "@/lib/utils";
import type { Project, ProjectCategory } from "@/types/project";
import type { ProjectSocialSignal } from "@/types/social";

type CategoryFilter = ProjectCategory | "All";
const PAGE_SIZE = 24;

export function ProjectDirectory({
  projects,
  socialSignals,
}: {
  projects: Project[];
  socialSignals?: ProjectSocialSignal[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hasActiveFilters = query.trim().length > 0 || category !== "All";
  const availableCategories = useMemo(() => {
    const populatedCategories = new Set(
      projects.map((project) => project.category),
    );

    return projectCategories.filter(
      (item) => item === "All" || populatedCategories.has(item),
    );
  }, [projects]);
  const socialSignalsBySlug = useMemo(
    () =>
      new Map(
        (socialSignals ?? []).map((signal) => [signal.project.slug, signal]),
      ),
    [socialSignals],
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      const matchesCategory =
        category === "All" || project.category === category;
      const searchableText = [
        project.name,
        project.tagline,
        project.description,
        project.builder,
        project.category,
        ...project.tags,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    return filtered;
  }, [category, projects, query]);
  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const remainingProjects = Math.max(
    filteredProjects.length - visibleProjects.length,
    0,
  );

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      id="projects"
    >
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-blueprint">
            Curated directory
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Projects shipping around Arc
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
            Fresh signals, builder context, and testnet traction in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-black text-ink/60 shadow-sm">
            <SlidersHorizontal
              aria-hidden
              className="size-5 text-blueprint"
              weight="duotone"
            />
            {filteredProjects.length} visible
          </div>
          <Link className="btn-primary min-h-10" href="/submit">
            <Plus aria-hidden className="size-4" weight="bold" />
            Submit project
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-ink/10 bg-white p-3 shadow-sm">
        <label className="relative block">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40"
            weight="duotone"
          />
          <input
            className="min-h-11 w-full rounded-lg border border-ink/10 bg-paper pl-10 pr-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/35 focus:border-blueprint"
            placeholder="Search projects, builders, tags"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </label>

        {hasActiveFilters ? (
          <button
            className="mt-3 min-h-10 rounded-lg border border-ink/10 bg-white px-3 text-sm font-black text-ink/60 transition hover:border-coral hover:text-coral"
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <X aria-hidden className="mr-1.5 inline size-3.5" />
            Reset filters
          </button>
        ) : null}
      </div>

      <div className="mb-8 flex max-w-full gap-2 overflow-x-auto pb-1">
        {availableCategories.map((item) => (
          <button
            aria-pressed={category === item}
            className={cn(
              "min-h-10 shrink-0 rounded-lg border px-3 text-sm font-black transition",
              category === item
                ? "border-blueprint bg-blueprint text-paper"
                : "border-ink/10 bg-white text-ink/65 shadow-sm hover:border-ink/30 hover:text-ink",
            )}
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <div id={project.slug} key={project.id}>
              <ProjectCard
                project={project}
                socialSignal={socialSignalsBySlug.get(project.slug)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-ink/20 bg-white p-8 text-center">
          <div>
            <p className="text-xl font-black text-ink">No signal found</p>
            <p className="mt-2 text-sm font-semibold text-ink/55">
              Try a broader category or search term.
            </p>
          </div>
        </div>
      )}

      {remainingProjects > 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            className="btn-ghost min-h-11 px-5"
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Load {Math.min(PAGE_SIZE, remainingProjects)} more projects
          </button>
          <p className="text-xs font-bold text-ink/40">
            Showing {visibleProjects.length} of {filteredProjects.length}
          </p>
        </div>
      ) : null}
    </section>
  );
}
