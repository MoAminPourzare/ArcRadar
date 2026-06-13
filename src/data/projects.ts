import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    id: "arc-escrow",
    slug: "arc-escrow",
    name: "Arc Escrow",
    tagline: "USDC escrow for AI-delivered work.",
    description:
      "A reference workflow for creating jobs, holding funds, validating deliverables, and releasing USDC on Arc Testnet.",
    category: "AI Agents",
    builder: "Circle sample builders",
    walletAddress: "0x0000000000000000000000000000000000000001",
    links: [
      { label: "Website", href: "https://example.com/arc-escrow" },
      { label: "Project X", href: "https://example.com/arc-escrow/x" },
      { label: "Builder X", href: "https://example.com/arc-escrow/builder" },
      { label: "Discord", href: "https://example.com/arc-escrow/discord" },
      { label: "GitHub", href: "https://example.com/arc-escrow/github" },
    ],
    tags: ["ERC-8183", "Escrow", "Agents"],
    featured: true,
    accent: "mint",
    lastSignal: "Reference flow indexed",
    profile: {
      problem:
        "Agent-delivered work needs a credible way to hold and release USDC without forcing every team to build escrow logic from scratch.",
      solution:
        "Arc Escrow frames a reusable job funding flow for requesters, agents, validators, and recipients using Arc Testnet USDC.",
      whyArc:
        "USDC-native gas and deterministic finality make escrow states easier to price, explain, and settle for builders testing agentic commerce.",
    },
    activity: [
      {
        label: "Profile indexed",
        detail: "Escrow flow added to the ArcRadar sample graph.",
        timestamp: "2026-06-09",
      },
      {
        label: "Docs tracked",
        detail: "Agentic economy docs linked for builder review.",
        timestamp: "2026-06-08",
      },
    ],
    metrics: {
      rank: 1,
      tipsUsdc: 0,
      weeklyTipsUsdc: 0,
      launches: 3,
    },
  },
  {
    id: "arc-commerce",
    slug: "arc-commerce",
    name: "Arc Commerce",
    tagline: "Checkout flows settled with testnet USDC.",
    description:
      "A commerce starter for accepting Arc Testnet USDC payments and tracking order settlement with deterministic finality.",
    category: "Payments",
    builder: "Arc sample apps",
    walletAddress: "0x0000000000000000000000000000000000000002",
    links: [
      { label: "Website", href: "https://example.com/arc-commerce" },
      { label: "GitHub", href: "https://example.com/arc-commerce/github" },
    ],
    tags: ["Checkout", "USDC", "Finality"],
    featured: true,
    accent: "cyan",
    lastSignal: "Payment flow mapped",
    profile: {
      problem:
        "Stablecoin checkout demos often feel bolted on and do not show how finality, refunds, and order state fit together.",
      solution:
        "Arc Commerce models a checkout surface where orders can settle in Arc Testnet USDC and expose payment state cleanly.",
      whyArc:
        "Fast finality and USDC-denominated gas reduce the mental overhead of explaining checkout fees and settlement timing.",
    },
    activity: [
      {
        label: "Signal updated",
        detail: "Checkout and finality story added to the directory.",
        timestamp: "2026-06-09",
      },
      {
        label: "Docs tracked",
        detail: "Payments build docs linked for future implementation.",
        timestamp: "2026-06-08",
      },
    ],
    metrics: {
      rank: 2,
      tipsUsdc: 0,
      weeklyTipsUsdc: 0,
      launches: 2,
    },
  },
  {
    id: "unified-usdc",
    slug: "unified-usdc",
    name: "Unified USDC",
    tagline: "One spendable USDC balance across chains.",
    description:
      "A multichain wallet concept using Circle Gateway and App Kits to deposit, view, and spend USDC across supported networks.",
    category: "Wallets",
    builder: "Gateway experimenters",
    walletAddress: "0x0000000000000000000000000000000000000003",
    links: [
      { label: "Project X", href: "https://example.com/unified-usdc/x" },
      { label: "Discord", href: "https://example.com/unified-usdc/discord" },
      { label: "GitHub", href: "https://example.com/unified-usdc/github" },
    ],
    tags: ["Gateway", "App Kits", "Multichain"],
    accent: "blueprint",
    lastSignal: "Gateway docs tracked",
    profile: {
      problem:
        "Builders want a single stablecoin balance experience, but users often hold USDC across many networks.",
      solution:
        "Unified USDC explores a wallet-facing view for deposits, spendable balances, and Arc settlement powered by Circle tooling.",
      whyArc:
        "Arc is designed around stablecoin finance, so a unified balance story can feel native rather than patched together.",
    },
    activity: [
      {
        label: "Watchlist added",
        detail: "Gateway and App Kit links captured for review.",
        timestamp: "2026-06-09",
      },
    ],
    metrics: {
      rank: 3,
      tipsUsdc: 0,
      weeklyTipsUsdc: 0,
      launches: 1,
    },
  },
  {
    id: "arc-router",
    slug: "arc-router",
    name: "Arc Router",
    tagline: "Stablecoin routing for app-native treasury ops.",
    description:
      "A treasury operations concept for routing Arc Testnet USDC between working wallets, vault addresses, and app modules.",
    category: "DeFi",
    builder: "Independent builders",
    walletAddress: "0x0000000000000000000000000000000000000004",
    links: [
      { label: "Website", href: "https://example.com/arc-router" },
      { label: "Builder X", href: "https://example.com/arc-router/builder" },
    ],
    tags: ["Treasury", "Routing", "Vaults"],
    accent: "amber",
    lastSignal: "Treasury pattern added",
    profile: {
      problem:
        "Small teams need treasury operations that are clearer than raw transfers but lighter than enterprise finance tooling.",
      solution:
        "Arc Router sketches a way to route USDC between operating wallets, app modules, and vault-like addresses.",
      whyArc:
        "USDC-native fees help treasury actions remain predictable during testnet experiments and product demos.",
    },
    activity: [
      {
        label: "Pattern indexed",
        detail: "Treasury routing use case added to the ArcRadar graph.",
        timestamp: "2026-06-09",
      },
    ],
    metrics: {
      rank: 4,
      tipsUsdc: 0,
      weeklyTipsUsdc: 0,
      launches: 1,
    },
  },
  {
    id: "arc-index-kit",
    slug: "arc-index-kit",
    name: "Arc Index Kit",
    tagline: "Index Arc events into builder-ready APIs.",
    description:
      "An infrastructure starter for syncing contract events, normalizing project activity, and serving leaderboard-ready data.",
    category: "Infrastructure",
    builder: "Data infra builders",
    walletAddress: "0x0000000000000000000000000000000000000005",
    links: [
      { label: "GitHub", href: "https://example.com/arc-index-kit/github" },
    ],
    tags: ["Indexer", "Events", "Leaderboard"],
    featured: true,
    accent: "coral",
    lastSignal: "Event model drafted",
    profile: {
      problem:
        "Onchain project activity is hard to turn into clean leaderboards and discovery signals without a purpose-built indexer.",
      solution:
        "Arc Index Kit outlines event sync, normalization, and API patterns for Arc project activity and tipping data.",
      whyArc:
        "Arc finality simplifies how indexers reason about committed activity and reduces reorg handling complexity.",
    },
    activity: [
      {
        label: "Indexing need identified",
        detail: "Tip and project activity schemas added to the planning track.",
        timestamp: "2026-06-09",
      },
    ],
    metrics: {
      rank: 5,
      tipsUsdc: 0,
      weeklyTipsUsdc: 0,
      launches: 2,
    },
  },
  {
    id: "arc-dev-console",
    slug: "arc-dev-console",
    name: "Arc Dev Console",
    tagline: "A command surface for testnet builders.",
    description:
      "A developer tools concept for chain config, faucet links, contract snippets, explorer shortcuts, and deployment checklists.",
    category: "Developer Tools",
    builder: "Tooling contributors",
    walletAddress: "0x0000000000000000000000000000000000000006",
    links: [
      { label: "Website", href: "https://example.com/arc-dev-console" },
      { label: "Project X", href: "https://example.com/arc-dev-console/x" },
      {
        label: "Builder X",
        href: "https://example.com/arc-dev-console/builder",
      },
      {
        label: "Discord",
        href: "https://example.com/arc-dev-console/discord",
      },
    ],
    tags: ["Deploy", "Config", "Tooling"],
    accent: "mint",
    lastSignal: "Builder workflow scoped",
    profile: {
      problem:
        "New builders need one command surface for network config, faucet links, explorer shortcuts, and deployment notes.",
      solution:
        "Arc Dev Console collects the operational details that developers need before deploying their first Arc Testnet app.",
      whyArc:
        "Arc is early enough that high-quality onboarding can become a strong ecosystem advantage.",
    },
    activity: [
      {
        label: "Workflow scoped",
        detail: "Core onboarding needs captured for future tooling.",
        timestamp: "2026-06-09",
      },
    ],
    metrics: {
      rank: 6,
      tipsUsdc: 0,
      weeklyTipsUsdc: 0,
      launches: 1,
    },
  },
];

export const projectCategories = [
  "All",
  "AI Agents",
  "Payments",
  "DeFi",
  "Infrastructure",
  "Wallets",
  "Developer Tools",
] as const;
