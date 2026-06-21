import type { Metadata } from "next";
import { ArrowSquareOutIcon as ExternalLink } from "@phosphor-icons/react/ssr";

import { BuilderHub } from "@/components/builders/builder-hub";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { arcContracts, arcTestnet } from "@/config/arc";

export const metadata: Metadata = {
  title: "Builders",
  description:
    "ArcRadar builder shortcuts for Arc Testnet setup, USDC payments, App Kit, Circle docs, contracts, and agent experiments.",
};

export default function BuildersPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-ink/10 bg-paper">
          <div className="radar-grid absolute inset-0 opacity-[0.08] [background-size:44px_44px]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-4xl">
              <p className="text-sm font-black uppercase text-blueprint">
                Builder hub
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Shortcut map for shipping useful Arc projects
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-ink/60">
                A practical guide board for builders: choose what you are
                trying to build, then jump straight to the right Arc, Circle,
                App Kit, Gateway, CCTP, contract, wallet, or agent docs.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HeroStat label="Network" value={arcTestnet.name} />
              <HeroStat label="Chain ID" value={arcTestnet.id.toString()} />
              <HeroStat label="Gas token" value="USDC / 18 decimals" />
              <HeroStat label="ERC-20 USDC" value={arcContracts.usdc} />
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <a
                className="btn-primary"
                href="https://docs.arc.io/llms.txt"
                rel="noreferrer"
                target="_blank"
              >
                Arc docs index
                <ExternalLink aria-hidden className="size-4" weight="bold" />
              </a>
              <a
                className="btn-ghost"
                href="https://developers.circle.com/llms.txt"
                rel="noreferrer"
                target="_blank"
              >
                Circle docs index
                <ExternalLink aria-hidden className="size-4" weight="bold" />
              </a>
            </div>
          </div>
        </section>

        <BuilderHub />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-ink/40">{label}</p>
      <p className="mt-2 break-all font-mono text-sm font-black text-ink">
        {value}
      </p>
    </div>
  );
}
