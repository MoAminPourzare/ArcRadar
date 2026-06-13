import { Activity, ExternalLink, Radar } from "lucide-react";
import Link from "next/link";

import { SiteNavigation } from "@/components/site/site-navigation";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid size-9 place-items-center rounded-lg bg-ink text-paper">
            <Radar aria-hidden className="size-5" />
          </span>
          <span className="leading-none">
            <span className="block text-base font-black tracking-normal text-ink">
              {siteConfig.name}
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-normal text-ink/45 sm:block">
              Arc Testnet index
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <SiteNavigation />
          <a
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
            href={siteConfig.links.explorer}
            rel="noreferrer"
            target="_blank"
          >
            Explorer
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            aria-label="Arc network status"
            className="hidden size-10 place-items-center rounded-lg border border-ink/10 bg-white text-forest shadow-sm transition hover:border-forest/40 md:grid"
            href={siteConfig.links.status}
            rel="noreferrer"
            target="_blank"
          >
            <Activity aria-hidden className="size-4" />
          </a>
          <ConnectWalletButton />
        </div>
      </div>
      <SiteNavigation mobile />
    </header>
  );
}
