import type { Metadata } from "next";
import { RadioTower } from "lucide-react";

import { ArcOnboarding } from "@/components/network/arc-onboarding";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { arcContracts, arcCurrency, arcTestnet } from "@/config/arc";

export const metadata: Metadata = {
  title: "Network",
  description:
    "Arc Testnet network details, USDC surfaces, faucet, RPC, and explorer references.",
};

export default function NetworkPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-ink/10 bg-paper">
          <div className="radar-grid absolute inset-0 opacity-[0.08] [background-size:44px_44px]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <span className="grid size-12 place-items-center rounded-lg bg-blueprint text-paper">
              <RadioTower aria-hidden className="size-6" />
            </span>
            <p className="mt-6 text-sm font-black uppercase text-blueprint">
              Arc Testnet reference
            </p>
            <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
              Network configuration without mixing the two USDC surfaces
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-ink/60">
              ArcRadar currently supports only Arc Testnet. Native USDC pays
              gas with {arcCurrency.nativeUsdcDecimals} decimals, while ERC-20
              USDC transfers use {arcCurrency.erc20UsdcDecimals} decimals.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NetworkValue label="Network" value={arcTestnet.name} />
              <NetworkValue label="Chain ID" value={arcTestnet.id.toString()} />
              <NetworkValue
                label="Native gas"
                value={`${arcCurrency.symbol} / ${arcCurrency.nativeUsdcDecimals} decimals`}
              />
              <NetworkValue label="ERC-20 USDC" value={arcContracts.usdc} />
            </div>
          </div>
        </section>
        <ArcOnboarding />
      </main>
      <SiteFooter />
    </div>
  );
}

function NetworkValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-ink/40">{label}</p>
      <p className="mt-2 break-all font-mono text-sm font-black text-ink">
        {value}
      </p>
    </div>
  );
}
