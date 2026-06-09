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
    status: "testnet",
    stage: "Public Testnet",
    builder: "Circle sample builders",
    walletAddress: "0x0000000000000000000000000000000000000001",
    links: [
      { label: "Docs", href: "https://docs.arc.io/build/agentic-economy" },
    ],
    tags: ["ERC-8183", "Escrow", "Agents"],
    featured: true,
    accent: "mint",
    lastSignal: "Reference flow indexed",
    profile: {
      builderNote:
        "Use this profile as the reference pattern for work that needs USDC escrow semantics before a full marketplace exists.",
      problem:
        "Agent-delivered work needs a credible way to hold and release USDC without forcing every team to build escrow logic from scratch.",
      solution:
        "Arc Escrow frames a reusable job funding flow for requesters, agents, validators, and recipients using Arc Testnet USDC.",
      whyArc:
        "USDC-native gas and deterministic finality make escrow states easier to price, explain, and settle for builders testing agentic commerce.",
      idealFor: ["AI agent teams", "Bounty workflows", "Service marketplaces"],
      roadmap: [
        { label: "Reference flow mapped", status: "done" },
        { label: "Tip and escrow events indexed", status: "building" },
        { label: "Dispute module prototype", status: "planned" },
      ],
      curationNotes: [
        "Good fit for Arc because the core asset and gas unit are both USDC.",
        "Needs strong UX around release conditions before real users rely on it.",
      ],
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
      supporters: 42,
      tipsUsdc: 128.5,
      weeklyTipsUsdc: 31.5,
      signalScore: 94,
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
    status: "building",
    stage: "Prototype",
    builder: "Arc sample apps",
    walletAddress: "0x0000000000000000000000000000000000000002",
    links: [{ label: "Docs", href: "https://docs.arc.io/build/payments" }],
    tags: ["Checkout", "USDC", "Finality"],
    featured: true,
    accent: "cyan",
    lastSignal: "Payment flow mapped",
    profile: {
      builderNote:
        "Keep the first version boring and reliable: payment state, finality, receipts, and refunds matter more than checkout novelty.",
      problem:
        "Stablecoin checkout demos often feel bolted on and do not show how finality, refunds, and order state fit together.",
      solution:
        "Arc Commerce models a checkout surface where orders can settle in Arc Testnet USDC and expose payment state cleanly.",
      whyArc:
        "Fast finality and USDC-denominated gas reduce the mental overhead of explaining checkout fees and settlement timing.",
      idealFor: ["Merchant tools", "Creator stores", "Payment demos"],
      roadmap: [
        { label: "Checkout state model", status: "done" },
        { label: "Order detail page", status: "building" },
        { label: "Refund and receipt flows", status: "planned" },
      ],
      curationNotes: [
        "Best positioned as a reference app until a real merchant integration exists.",
        "Needs precise copy around testnet USDC to avoid confusing users.",
      ],
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
      supporters: 31,
      tipsUsdc: 96,
      weeklyTipsUsdc: 22,
      signalScore: 88,
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
    status: "watchlist",
    stage: "Research",
    builder: "Gateway experimenters",
    walletAddress: "0x0000000000000000000000000000000000000003",
    links: [
      { label: "Docs", href: "https://docs.arc.io/app-kit/unified-balance" },
    ],
    tags: ["Gateway", "App Kits", "Multichain"],
    accent: "blueprint",
    lastSignal: "Gateway docs tracked",
    profile: {
      builderNote:
        "This belongs on the watchlist until there is a concrete Gateway-backed prototype with visible balance movement.",
      problem:
        "Builders want a single stablecoin balance experience, but users often hold USDC across many networks.",
      solution:
        "Unified USDC explores a wallet-facing view for deposits, spendable balances, and Arc settlement powered by Circle tooling.",
      whyArc:
        "Arc is designed around stablecoin finance, so a unified balance story can feel native rather than patched together.",
      idealFor: ["Wallets", "Treasury dashboards", "Multichain apps"],
      roadmap: [
        { label: "Gateway concept captured", status: "done" },
        { label: "Balance display prototype", status: "planned" },
        { label: "Cross-chain spend flow", status: "planned" },
      ],
      curationNotes: [
        "Currently a watchlist concept, not a live integration.",
        "Should be upgraded only after concrete Gateway implementation work exists.",
      ],
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
      supporters: 24,
      tipsUsdc: 72.25,
      weeklyTipsUsdc: 13.75,
      signalScore: 81,
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
    status: "building",
    stage: "Prototype",
    builder: "Independent builders",
    walletAddress: "0x0000000000000000000000000000000000000004",
    links: [{ label: "Docs", href: "https://docs.arc.io/build/defi" }],
    tags: ["Treasury", "Routing", "Vaults"],
    accent: "amber",
    lastSignal: "Treasury pattern added",
    profile: {
      builderNote:
        "Treat this as operations tooling, not yield tooling. The value is clarity around stablecoin movement and policy.",
      problem:
        "Small teams need treasury operations that are clearer than raw transfers but lighter than enterprise finance tooling.",
      solution:
        "Arc Router sketches a way to route USDC between operating wallets, app modules, and vault-like addresses.",
      whyArc:
        "USDC-native fees help treasury actions remain predictable during testnet experiments and product demos.",
      idealFor: ["Startup treasuries", "DAO operators", "Stablecoin apps"],
      roadmap: [
        { label: "Routing concept scoped", status: "done" },
        { label: "Wallet policy model", status: "building" },
        { label: "Treasury activity ledger", status: "planned" },
      ],
      curationNotes: [
        "Needs careful language: no yield promise, no custody promise.",
        "Could become useful once real project wallets are onboarded.",
      ],
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
      supporters: 18,
      tipsUsdc: 54,
      weeklyTipsUsdc: 18,
      signalScore: 76,
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
    status: "testnet",
    stage: "Community",
    builder: "Data infra builders",
    walletAddress: "0x0000000000000000000000000000000000000005",
    links: [{ label: "Explorer", href: "https://testnet.arcscan.app" }],
    tags: ["Indexer", "Events", "Leaderboard"],
    featured: true,
    accent: "coral",
    lastSignal: "Event model drafted",
    profile: {
      builderNote:
        "ArcRadar itself will need this class of infrastructure once tips become real onchain events.",
      problem:
        "Onchain project activity is hard to turn into clean leaderboards and discovery signals without a purpose-built indexer.",
      solution:
        "Arc Index Kit outlines event sync, normalization, and API patterns for Arc project activity and tipping data.",
      whyArc:
        "Arc finality simplifies how indexers reason about committed activity and reduces reorg handling complexity.",
      idealFor: ["Data infra teams", "Leaderboard apps", "Analytics tools"],
      roadmap: [
        { label: "Event model drafted", status: "done" },
        { label: "Project tipping schema", status: "building" },
        { label: "Worker and API adapter", status: "planned" },
      ],
      curationNotes: [
        "This is strategically important because ArcRadar will need indexing after the TipRouter phase.",
        "Should become a real package or service if more apps start emitting project events.",
      ],
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
      supporters: 15,
      tipsUsdc: 42.75,
      weeklyTipsUsdc: 16.25,
      signalScore: 73,
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
    status: "watchlist",
    stage: "Community",
    builder: "Tooling contributors",
    walletAddress: "0x0000000000000000000000000000000000000006",
    links: [{ label: "Docs", href: "https://docs.arc.io/build" }],
    tags: ["Deploy", "Config", "Tooling"],
    accent: "mint",
    lastSignal: "Builder workflow scoped",
    profile: {
      builderNote:
        "A strong developer console should compress setup friction without pretending to replace official docs.",
      problem:
        "New builders need one command surface for network config, faucet links, explorer shortcuts, and deployment notes.",
      solution:
        "Arc Dev Console collects the operational details that developers need before deploying their first Arc Testnet app.",
      whyArc:
        "Arc is early enough that high-quality onboarding can become a strong ecosystem advantage.",
      idealFor: ["New builders", "Hackathon teams", "Protocol educators"],
      roadmap: [
        { label: "Builder checklist scoped", status: "done" },
        { label: "Network setup snippets", status: "building" },
        { label: "Contract deploy assistant", status: "planned" },
      ],
      curationNotes: [
        "Good companion surface for ArcRadar itself.",
        "Should stay practical and avoid becoming a generic docs clone.",
      ],
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
      supporters: 11,
      tipsUsdc: 29.5,
      weeklyTipsUsdc: 9.5,
      signalScore: 68,
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

export const projectStatuses = [
  "All",
  "testnet",
  "building",
  "live",
  "watchlist",
] as const;
