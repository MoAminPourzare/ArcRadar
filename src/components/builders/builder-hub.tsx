"use client";

import { useMemo, useState } from "react";

import {
  builderChecklist,
  builderFacts,
  builderPaths,
  builderShortcuts,
  type BuilderLink,
  type BuilderPathId,
} from "@/data/builder-hub";
import { cn } from "@/lib/utils";

type BuilderFilter = "all" | BuilderPathId;

export function BuilderHub() {
  const [activeFilter, setActiveFilter] = useState<BuilderFilter>("all");

  const activePath = builderPaths.find((path) => path.id === activeFilter);
  const shortcuts = useMemo(() => {
    if (activeFilter === "all") {
      return builderShortcuts;
    }

    return builderShortcuts.filter((shortcut) =>
      shortcut.pathIds.includes(activeFilter),
    );
  }, [activeFilter]);

  return (
    <section className="border-b border-ink/10 bg-paper py-10 sm:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-black uppercase text-blueprint">
              Choose a builder path
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-ink">
              What are you trying to ship?
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-ink/55">
              Pick the closest intent. ArcRadar will narrow the docs to the
              shortest useful path instead of making builders dig through every
              product page.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <FilterButton
                active={activeFilter === "all"}
                label="All"
                onClick={() => setActiveFilter("all")}
              />
              {builderPaths.map((path) => (
                <FilterButton
                  active={activeFilter === path.id}
                  key={path.id}
                  label={path.label}
                  onClick={() => setActiveFilter(path.id)}
                />
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-xs font-black uppercase text-ink/40">
                Current focus
              </p>
              <h3 className="mt-2 text-xl font-black text-ink">
                {activePath?.headline ?? "Full builder map"}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">
                {activePath?.description ??
                  "A complete shortcut board for Arc setup, USDC payments, contracts, liquidity, agents, and production readiness."}
              </p>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {builderFacts.map((fact) => (
                <div
                  className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-black uppercase leading-5 text-ink/55"
                  key={fact}
                >
                  {fact}
                </div>
              ))}
            </div>
          </aside>

          <div className="grid gap-3 sm:grid-cols-2">
            {shortcuts.map((shortcut) => (
              <article
                className="group flex min-h-full flex-col rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ink/25"
                key={shortcut.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-blueprint">
                      {shortcut.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-black leading-tight text-ink">
                      {shortcut.title}
                    </h3>
                  </div>
                  <span className="rounded-full border border-ink/10 bg-paper px-2.5 py-1 text-[10px] font-black uppercase text-ink/45">
                    {shortcut.primaryLink.source}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold leading-6 text-ink/55">
                  {shortcut.summary}
                </p>

                <div className="mt-4 rounded-lg border border-ink/10 bg-paper p-3">
                  <p className="text-[10px] font-black uppercase text-ink/35">
                    Outcome
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 text-ink/70">
                    {shortcut.outcome}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {shortcut.tags.map((tag) => (
                    <span
                      className="rounded-md bg-ink/5 px-2 py-1 text-[10px] font-black uppercase text-ink/45"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-ink/55">
                  {shortcut.checkpoints.map((checkpoint) => (
                    <li className="flex gap-2" key={checkpoint}>
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-mint"
                      />
                      <span>{checkpoint}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <a
                    className="btn-primary w-full"
                    href={shortcut.primaryLink.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {shortcut.primaryLink.label}
                  </a>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {shortcut.links.map((link) => (
                      <DocLink key={link.href} link={link} />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-blueprint">
                Builder readiness checklist
              </p>
              <h2 className="mt-2 text-3xl font-black text-ink">
                Before a project becomes useful inside ArcRadar
              </h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-ink/55">
              This is the product-facing checklist I would keep next to project
              onboarding, tipping, and leaderboard work.
            </p>
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {builderChecklist.map((item, index) => (
              <div
                className="rounded-lg border border-ink/10 bg-paper p-4"
                key={item}
              >
                <p className="font-mono text-xs font-black text-blueprint">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-black leading-6 text-ink">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "min-h-10 rounded-lg border px-3 text-sm font-black uppercase transition",
        active
          ? "border-ink bg-ink text-paper"
          : "border-ink/10 bg-white text-ink/55 hover:border-ink/25 hover:text-ink",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function DocLink({ link }: { link: BuilderLink }) {
  return (
    <a
      className={cn(
        "inline-flex min-h-10 items-center justify-between gap-2 rounded-lg border px-3 text-xs font-black uppercase transition hover:-translate-y-0.5",
        link.source === "Arc" &&
          "border-mint/40 bg-mint/15 text-forest hover:border-mint",
        link.source === "Circle" &&
          "border-blueprint/20 bg-blueprint/10 text-blueprint hover:border-blueprint/45",
        link.source === "Tool" &&
          "border-ink/10 bg-paper text-ink/55 hover:border-ink/25 hover:text-ink",
      )}
      href={link.href}
      rel="noreferrer"
      target="_blank"
    >
      <span>{link.label}</span>
      <span aria-hidden="true">-&gt;</span>
    </a>
  );
}
