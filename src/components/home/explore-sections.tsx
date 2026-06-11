import {
  ArrowRight,
  ChartNoAxesCombined,
  FolderSearch2,
  RadioTower,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

const sections = [
  {
    description:
      "Browse the curated Arc Testnet directory, filter projects, and open full builder profiles.",
    href: "/projects",
    icon: FolderSearch2,
    label: "Projects",
    tone: "bg-mint/25 text-forest",
  },
  {
    description:
      "Explore automatic signal scores, tip activity, and public project context.",
    href: "/signals",
    icon: Sparkles,
    label: "Signals",
    tone: "bg-cyan/25 text-blueprint",
  },
  {
    description:
      "Compare project support, weekly momentum, recent activity, and top tipping wallets.",
    href: "/leaderboard",
    icon: ChartNoAxesCombined,
    label: "Leaderboard",
    tone: "bg-amber/25 text-ink",
  },
  {
    description:
      "Review Arc Testnet chain details, official resources, USDC contracts, and faucet links.",
    href: "/network",
    icon: RadioTower,
    label: "Network",
    tone: "bg-coral/15 text-coral",
  },
  {
    description:
      "Connect a wallet and check Arc network, native gas USDC, and ERC-20 tip balance separately.",
    href: "/wallet",
    icon: WalletCards,
    label: "Wallet",
    tone: "bg-blueprint/10 text-blueprint",
  },
] as const;

export function ExploreSections() {
  return (
    <section className="border-b border-ink/10 bg-white py-12 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 max-w-3xl">
          <p className="text-sm font-black uppercase text-blueprint">
            Explore ArcRadar
          </p>
          <h2 className="mt-2 text-3xl font-black text-ink sm:text-4xl">
            One focused workspace for every part of the map
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/55">
            Each area now has its own route, data surface, and purpose. Start
            with the directory, then move through signals, support, network,
            and wallet readiness.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                className="group flex min-h-64 flex-col rounded-lg border border-ink/10 bg-paper p-5 shadow-sm transition hover:-translate-y-1 hover:border-ink/25"
                href={section.href}
                key={section.href}
              >
                <span
                  className={`grid size-11 place-items-center rounded-lg ${section.tone}`}
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-6 text-xl font-black text-ink">
                  {section.label}
                </h3>
                <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-ink/55">
                  {section.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blueprint">
                  Open section
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition group-hover:translate-x-1"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
