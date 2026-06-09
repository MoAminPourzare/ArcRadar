import { ArrowUpRight, Radar } from "lucide-react";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-ink text-paper">
            <Radar aria-hidden className="size-5" />
          </span>
          <div>
            <p className="font-black text-ink">{siteConfig.name}</p>
            <p className="text-sm font-semibold text-ink/50">
              Curated for Arc Testnet builders.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-bold text-ink/60">
          <a
            className="inline-flex items-center gap-1.5 transition hover:text-ink"
            href={siteConfig.links.docs}
            rel="noreferrer"
            target="_blank"
          >
            Arc docs
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
          <a
            className="inline-flex items-center gap-1.5 transition hover:text-ink"
            href={siteConfig.links.explorer}
            rel="noreferrer"
            target="_blank"
          >
            Explorer
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
