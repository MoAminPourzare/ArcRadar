import {
  ArrowRightIcon as ArrowRight,
  BookOpenTextIcon as BookOpenText,
  CardsIcon as WalletCards,
  CellTowerIcon as RadioTower,
  ChartLineUpIcon as ChartNoAxesCombined,
  FolderOpenIcon as FolderSearch2,
  RobotIcon as Bot,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";

const sections = [
  {
    description:
      "Browse the curated Arc Testnet directory, filter projects, and open full builder profiles.",
    href: "/projects",
    disabled: false,
    icon: FolderSearch2,
    label: "Projects",
    tone: "bg-mint/25 text-forest",
  },
  {
    description:
      "Jump into practical Arc and Circle docs by intent: setup, USDC payments, contracts, liquidity, agents, and production readiness.",
    href: "/builders",
    disabled: false,
    icon: BookOpenText,
    label: "Builders",
    tone: "bg-mint/20 text-forest",
  },
  {
    description:
      "Run paid testnet readiness audits that check project profiles, websites, USDC tipping setup, Arc proof, and activity signals.",
    disabled: false,
    href: "/agent",
    icon: Bot,
    label: "Agent",
    tone: "bg-cyan/25 text-blueprint",
  },
  {
    description:
      "Compare project support, weekly momentum, recent activity, and top tipping wallets.",
    href: "/leaderboard",
    disabled: false,
    icon: ChartNoAxesCombined,
    label: "Leaderboard",
    tone: "bg-amber/25 text-ink",
  },
  {
    description:
      "Review Arc Testnet chain details, official resources, USDC contracts, and faucet links.",
    href: "/network",
    disabled: false,
    icon: RadioTower,
    label: "Network",
    tone: "bg-coral/15 text-coral",
  },
  {
    description:
      "Connect a wallet and check Arc network, native gas USDC, and ERC-20 tip balance separately.",
    href: "/wallet",
    disabled: false,
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
            with the directory, use the builder hub for docs shortcuts, then
            move through support, network, wallet readiness, and agent-powered
            project checks.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;

            if (section.disabled) {
              return (
                <div
                  aria-disabled="true"
                  className="flex min-h-64 cursor-not-allowed flex-col rounded-lg border border-dashed border-ink/15 bg-paper/60 p-5 opacity-65"
                  key={section.href}
                >
                  <span
                    className={`grid size-11 place-items-center rounded-lg ${section.tone}`}
                  >
                    <Icon aria-hidden className="size-6" weight="duotone" />
                  </span>
                  <div className="mt-6 flex items-center gap-2">
                    <h3 className="text-xl font-black text-ink">
                      {section.label}
                    </h3>
                    <span className="rounded-md bg-ink/5 px-2 py-1 text-[10px] font-black uppercase text-ink/40">
                      Coming soon
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-ink/45">
                    {section.description}
                  </p>
                  <span className="mt-6 text-sm font-black text-ink/30">
                    Not available yet
                  </span>
                </div>
              );
            }

            return (
              <Link
                className="group flex min-h-64 flex-col rounded-lg border border-ink/10 bg-paper p-5 shadow-sm transition hover:-translate-y-1 hover:border-ink/25"
                href={section.href}
                key={section.href}
              >
                <span
                  className={`grid size-11 place-items-center rounded-lg ${section.tone}`}
                >
                  <Icon aria-hidden className="size-6" weight="duotone" />
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
