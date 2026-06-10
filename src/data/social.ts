import type { ProjectCategory } from "@/types/project";
import type { HackathonTrack, ProjectCollection } from "@/types/social";

export const collectionDefinitions: Array<
  Omit<ProjectCollection, "projectSlugs"> & {
    categories?: ProjectCategory[];
    tags?: string[];
  }
> = [
  {
    accent: "mint",
    categories: ["AI Agents"],
    description:
      "Agent jobs, escrow patterns, and autonomous USDC workflows that make Arc feel like a programmable settlement layer.",
    id: "arc-ai-agents",
    tags: ["Agents", "Escrow", "ERC-8183"],
    title: "Arc AI Agents",
    track: "Agentic Economy",
  },
  {
    accent: "cyan",
    categories: ["Payments", "Wallets"],
    description:
      "Checkout, balance, and wallet surfaces that make testnet USDC usable without explaining chain plumbing.",
    id: "arc-payments-stack",
    tags: ["Checkout", "USDC", "Gateway", "Finality"],
    title: "Arc Payments Stack",
    track: "Stablecoin UX",
  },
  {
    accent: "coral",
    categories: ["Infrastructure", "Developer Tools"],
    description:
      "Indexing, deployment, and builder console primitives that help new Arc apps become observable faster.",
    id: "arc-builder-infra",
    tags: ["Indexer", "Events", "Deploy", "Tooling"],
    title: "Arc Builder Infra",
    track: "Infra and Tooling",
  },
  {
    accent: "amber",
    categories: ["DeFi", "Infrastructure"],
    description:
      "Risk-aware treasury, routing, and event-ledger concepts for teams operating in USDC from day one.",
    id: "arc-ops-treasury",
    tags: ["Treasury", "Routing", "Vaults", "Leaderboard"],
    title: "Arc Ops Treasury",
    track: "USDC Operations",
  },
];

export const hackathonTrackDefinitions: Array<
  Omit<HackathonTrack, "projectSlugs"> & {
    categories?: ProjectCategory[];
    tags?: string[];
  }
> = [
  {
    categories: ["AI Agents", "Payments"],
    description:
      "Build around agent jobs, checkout flows, and message-rich USDC support loops.",
    id: "agentic-usdc-sprint",
    tags: ["Agents", "Escrow", "Checkout"],
    title: "Agentic USDC Sprint",
  },
  {
    categories: ["Infrastructure", "Developer Tools"],
    description:
      "Ship indexers, deploy helpers, explorer shortcuts, and project analytics surfaces.",
    id: "builder-ops-track",
    tags: ["Indexer", "Events", "Deploy", "Config"],
    title: "Builder Ops Track",
  },
  {
    categories: ["DeFi", "Wallets"],
    description:
      "Prototype treasury movement, wallet policy, balance UX, and safer routing ideas.",
    id: "stablecoin-ops-track",
    tags: ["Treasury", "Gateway", "Routing", "Vaults"],
    title: "Stablecoin Ops Track",
  },
];

export const manualProjectBadges = {
  "arc-commerce": [
    {
      description: "A clean demo candidate for finality, receipts, and refunds.",
      label: "Payments Stack",
      tone: "cyan",
    },
  ],
  "arc-dev-console": [
    {
      description: "Useful for hackathon teams and first-time Arc deployers.",
      label: "Builder Onboarder",
      tone: "mint",
    },
  ],
  "arc-escrow": [
    {
      description: "A core pattern for agent-delivered work and USDC release.",
      label: "Agent Primitive",
      tone: "mint",
    },
  ],
  "arc-index-kit": [
    {
      description: "Event-first infrastructure for leaderboards and activity feeds.",
      label: "Indexer Ready",
      tone: "coral",
    },
  ],
  "arc-router": [
    {
      description: "Treasury movement without yield promises or custody claims.",
      label: "Risk Aware",
      tone: "amber",
    },
  ],
  "unified-usdc": [
    {
      description: "Watchlist signal for cross-chain balance and Gateway UX.",
      label: "Gateway Watch",
      tone: "blueprint",
    },
  ],
} as const;
