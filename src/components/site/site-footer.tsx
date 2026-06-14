import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/ssr";

import { BrandMark } from "@/components/site/brand-mark";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10" sizes="40px" />
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
            <ArrowUpRight aria-hidden className="size-3.5" weight="bold" />
          </a>
          <a
            className="inline-flex items-center gap-1.5 transition hover:text-ink"
            href={siteConfig.links.explorer}
            rel="noreferrer"
            target="_blank"
          >
            Explorer
            <ArrowUpRight aria-hidden className="size-3.5" weight="bold" />
          </a>
        </div>
      </div>
    </footer>
  );
}
