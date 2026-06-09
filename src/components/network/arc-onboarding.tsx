import {
  ArrowUpRight,
  BadgeDollarSign,
  Fuel,
  Landmark,
  Wallet,
  RadioTower,
  ShieldCheck,
} from "lucide-react";

import { arcContracts, arcLinks, arcTestnet } from "@/config/arc";

const networkFacts = [
  {
    icon: Landmark,
    label: "Chain",
    value: arcTestnet.id.toString(),
  },
  {
    icon: Fuel,
    label: "Gas",
    value: "USDC",
  },
  {
    icon: RadioTower,
    label: "RPC",
    value: "testnet.arc.network",
  },
  {
    icon: ShieldCheck,
    label: "Finality",
    value: "Sub-second",
  },
];

export function ArcOnboarding() {
  return (
    <section className="border-y border-ink/10 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {networkFacts.map((fact) => {
            const Icon = fact.icon;

            return (
              <div
                className="flex min-h-20 items-center gap-3 rounded-lg border border-ink/10 bg-paper px-4"
                key={fact.label}
              >
                <span className="grid size-9 place-items-center rounded-md bg-mint/20 text-forest">
                  <Icon aria-hidden className="size-4" />
                </span>
                <span>
                  <span className="block text-xs font-bold uppercase text-ink/40">
                    {fact.label}
                  </span>
                  <span className="block break-all font-mono text-sm font-semibold text-ink">
                    {fact.value}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <a
            className="btn-secondary"
            href={arcLinks.faucet}
            rel="noreferrer"
            target="_blank"
          >
            Arc faucet
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
          <a
            className="btn-ghost"
            href={arcLinks.explorer}
            rel="noreferrer"
            target="_blank"
          >
            Explorer
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
          <a className="btn-primary" href="#wallet">
            Wallet console
            <Wallet aria-hidden className="size-4" />
          </a>
          <div className="flex min-h-16 items-center gap-3 rounded-lg border border-ink/10 bg-paper px-4 sm:col-span-2 lg:col-span-1">
            <span className="grid size-9 place-items-center rounded-md bg-blueprint text-paper">
              <BadgeDollarSign aria-hidden className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase text-ink/40">
                ERC-20 USDC
              </span>
              <span className="block truncate font-mono text-xs font-semibold text-ink">
                {arcContracts.usdc}
              </span>
              <span className="mt-1 block text-xs font-bold text-ink/45">
                Tip transfer surface; gas balance is checked separately.
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
