export type BuilderPathId =
  | "start"
  | "payments"
  | "contracts"
  | "liquidity"
  | "agents"
  | "production";

export type BuilderPath = {
  id: BuilderPathId;
  label: string;
  headline: string;
  description: string;
};

export type BuilderLink = {
  href: string;
  label: string;
  source: "Arc" | "Circle" | "Tool";
};

export type BuilderShortcut = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  outcome: string;
  pathIds: BuilderPathId[];
  tags: string[];
  checkpoints: string[];
  primaryLink: BuilderLink;
  links: BuilderLink[];
};

export const builderPaths: BuilderPath[] = [
  {
    id: "start",
    label: "Start",
    headline: "Set up the chain, wallet, and test funds first.",
    description:
      "Use this path when a builder just needs Arc Testnet working locally before touching app logic.",
  },
  {
    id: "payments",
    label: "Payments",
    headline: "Move USDC, receive tips, and design stablecoin payment flows.",
    description:
      "Best for apps that need transfers, allowances, payment UX, or wallet-to-wallet flows.",
  },
  {
    id: "contracts",
    label: "Contracts",
    headline: "Deploy, call, and monitor Solidity contracts on Arc.",
    description:
      "For teams shipping protocol logic, escrow, registries, routing, or other onchain systems.",
  },
  {
    id: "liquidity",
    label: "Liquidity",
    headline: "Bridge, swap, and expose a unified USDC balance.",
    description:
      "Use this for apps that need USDC to move across chains without making users think about rails.",
  },
  {
    id: "agents",
    label: "Agents",
    headline: "Explore agent identity, jobs, and machine-payment primitives.",
    description:
      "A focused lane for later ArcRadar Agent work and AI-native settlement experiments.",
  },
  {
    id: "production",
    label: "Production",
    headline: "Add reliability, indexing, compliance, and user safety checks.",
    description:
      "For moving from a demo to something builders can trust, monitor, and operate.",
  },
];

export const builderFacts = [
  "Arc is currently Testnet-only.",
  "Chain ID: 5042002.",
  "Native gas is USDC with 18 decimals.",
  "ERC-20 USDC app transfers use 6 decimals.",
  "Arc Testnet USDC contract: 0x3600000000000000000000000000000000000000.",
] as const;

export const builderShortcuts: BuilderShortcut[] = [
  {
    id: "connect-arc",
    eyebrow: "Network setup",
    title: "Connect a wallet or app to Arc Testnet",
    summary:
      "Use the official Arc network values before debugging wallet behavior, balances, or failed requests.",
    outcome:
      "A wallet and local client pointed at the correct RPC, chain ID, explorer, and USDC gas symbol.",
    pathIds: ["start", "production"],
    tags: ["RPC", "Wallet", "Chain ID"],
    checkpoints: [
      "Use Arc Testnet chain ID 5042002.",
      "Prefer the primary Arc RPC first, then fall back to listed providers.",
      "Keep explorer links pointed at ArcScan testnet.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/arc/references/connect-to-arc",
      label: "Open Arc setup",
      source: "Arc",
    },
    links: [
      {
        href: "https://testnet.arcscan.app",
        label: "ArcScan explorer",
        source: "Tool",
      },
      {
        href: "https://status.arc.io",
        label: "Network status",
        source: "Tool",
      },
    ],
  },
  {
    id: "fund-wallet",
    eyebrow: "Test funds",
    title: "Get testnet USDC for gas and transfers",
    summary:
      "Arc uses USDC for gas, so a wallet with no testnet USDC cannot pay for transactions or tips.",
    outcome:
      "A funded test wallet that can sign, approve, tip, deploy, and interact with contracts.",
    pathIds: ["start", "payments", "contracts"],
    tags: ["Faucet", "USDC", "Gas"],
    checkpoints: [
      "Select Arc Testnet in the faucet when available.",
      "Remember gas accounting and ERC-20 transfers use different decimals.",
      "Re-check the wallet page after funding.",
    ],
    primaryLink: {
      href: "https://faucet.circle.com",
      label: "Open faucet",
      source: "Tool",
    },
    links: [
      {
        href: "https://docs.arc.io/arc/references/gas-and-fees",
        label: "Gas and fee model",
        source: "Arc",
      },
      {
        href: "https://docs.arc.io/arc/references/contract-addresses",
        label: "USDC contract address",
        source: "Arc",
      },
    ],
  },
  {
    id: "usdc-surfaces",
    eyebrow: "USDC model",
    title: "Handle native gas USDC and ERC-20 USDC correctly",
    summary:
      "This is the most common source of bugs: Arc gas uses USDC with 18 decimals, while app-level ERC-20 USDC uses 6 decimals.",
    outcome:
      "Balances, allowances, transfer amounts, and gas fee displays that do not mix precision units.",
    pathIds: ["start", "payments", "contracts", "production"],
    tags: ["Decimals", "Allowance", "Balances"],
    checkpoints: [
      "Use ERC-20 decimals for approve, transfer, and transferFrom.",
      "Display gas fees separately from ERC-20 tip balances.",
      "Read contract addresses from official docs before wiring constants.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/arc/references/gas-and-fees",
      label: "Read gas details",
      source: "Arc",
    },
    links: [
      {
        href: "https://docs.arc.io/arc/references/contract-addresses",
        label: "Arc contract addresses",
        source: "Arc",
      },
      {
        href: "https://developers.circle.com/stablecoins/usdc-contract-addresses",
        label: "Circle USDC addresses",
        source: "Circle",
      },
    ],
  },
  {
    id: "deploy-contract",
    eyebrow: "Smart contracts",
    title: "Deploy a Solidity contract on Arc",
    summary:
      "Arc is EVM-compatible, but builders should still review Arc-specific differences before shipping a contract.",
    outcome:
      "A deployed contract with verified assumptions about fees, addresses, and EVM behavior.",
    pathIds: ["contracts", "start"],
    tags: ["Hardhat", "Foundry", "Viem"],
    checkpoints: [
      "Review EVM differences before porting existing code.",
      "Use the Arc deploy tutorial for the base workflow.",
      "Keep deployment scripts testnet-aware.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/arc/tutorials/deploy-on-arc",
      label: "Open deploy guide",
      source: "Arc",
    },
    links: [
      {
        href: "https://docs.arc.io/arc/references/evm-differences",
        label: "EVM differences",
        source: "Arc",
      },
      {
        href: "https://developers.circle.com/contracts",
        label: "Circle contracts",
        source: "Circle",
      },
    ],
  },
  {
    id: "interact-monitor",
    eyebrow: "Onchain ops",
    title: "Call contracts and monitor events",
    summary:
      "After deployment, teams need safe reads, writes, event indexing, and a reliable way to verify what happened.",
    outcome:
      "A clean loop for ABI calls, event reads, explorer checks, and backend sync jobs.",
    pathIds: ["contracts", "production"],
    tags: ["Events", "ABI", "Indexing"],
    checkpoints: [
      "Separate read-only calls from transactions.",
      "Use event logs for durable activity history.",
      "Cross-check important writes in ArcScan.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/arc/tutorials/interact-with-contracts",
      label: "Open interaction guide",
      source: "Arc",
    },
    links: [
      {
        href: "https://docs.arc.io/arc/tutorials/monitor-contract-events",
        label: "Monitor events",
        source: "Arc",
      },
      {
        href: "https://docs.arc.io/arc/tools/data-indexers",
        label: "Data indexers",
        source: "Arc",
      },
    ],
  },
  {
    id: "send-usdc",
    eyebrow: "Payments",
    title: "Send USDC in a product flow",
    summary:
      "Use this when the app needs simple wallet-to-wallet USDC movement, payment confirmation, or tip-like flows.",
    outcome:
      "A clear send flow with amount parsing, recipient validation, status handling, and explorer links.",
    pathIds: ["payments"],
    tags: ["Send", "USDC", "Receipts"],
    checkpoints: [
      "Parse user amounts using ERC-20 USDC decimals.",
      "Surface pending, confirmed, and failed states.",
      "Store tx hashes for later leaderboard or activity sync.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/app-kit/send",
      label: "Open App Kit Send",
      source: "Arc",
    },
    links: [
      {
        href: "https://developers.circle.com",
        label: "Circle payment workflows",
        source: "Circle",
      },
      {
        href: "https://docs.arc.io/arc/references/transaction-memos",
        label: "Transaction memos",
        source: "Arc",
      },
    ],
  },
  {
    id: "bridge-usdc",
    eyebrow: "Crosschain",
    title: "Bridge USDC into Arc",
    summary:
      "For users who have USDC elsewhere, route them through App Kit or CCTP rather than making them manually discover rails.",
    outcome:
      "A crosschain deposit path that brings USDC to Arc and shows progress until funds are usable.",
    pathIds: ["liquidity", "payments"],
    tags: ["Bridge", "CCTP", "Deposit"],
    checkpoints: [
      "Use CCTP V2 flows for crosschain USDC.",
      "Track bridge progress and recovery states.",
      "Make the destination chain and recipient obvious.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/app-kit/bridge",
      label: "Open App Kit Bridge",
      source: "Arc",
    },
    links: [
      {
        href: "https://developers.circle.com/cctp/quickstarts/transfer-usdc-ethereum-to-arc",
        label: "CCTP Ethereum to Arc",
        source: "Circle",
      },
      {
        href: "https://docs.arc.io/app-kit/quickstarts/bridge-tokens-across-blockchains",
        label: "Bridge quickstart",
        source: "Arc",
      },
    ],
  },
  {
    id: "unified-balance",
    eyebrow: "Liquidity UX",
    title: "Expose a unified USDC balance",
    summary:
      "Use this when a product should feel chain-abstracted and spend from a single USDC balance across supported networks.",
    outcome:
      "A user experience that reduces chain switching and lets builders focus on app intent.",
    pathIds: ["liquidity", "payments"],
    tags: ["Gateway", "Unified balance", "UX"],
    checkpoints: [
      "Decide whether App Kit or Gateway is the right abstraction.",
      "Show the user where funds are available and where they will settle.",
      "Design errors around liquidity and unsupported chains.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/app-kit/unified-balance",
      label: "Open Unified Balance",
      source: "Arc",
    },
    links: [
      {
        href: "https://developers.circle.com/gateway",
        label: "Circle Gateway",
        source: "Circle",
      },
      {
        href: "https://developers.circle.com/gateway/nanopayments",
        label: "Gateway nanopayments",
        source: "Circle",
      },
    ],
  },
  {
    id: "swap-fx",
    eyebrow: "Stablecoin FX",
    title: "Add swaps or stablecoin FX paths",
    summary:
      "For commerce or treasury apps, this is the lane for same-chain swaps, crosschain swaps, and stablecoin FX exploration.",
    outcome:
      "A route that can quote, execute, and explain fees for swap or FX actions.",
    pathIds: ["liquidity", "payments"],
    tags: ["Swap", "FX", "Quotes"],
    checkpoints: [
      "Start with same-chain swap before crosschain swap.",
      "Show fees before execution.",
      "Keep settlement currency obvious.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/app-kit/swap",
      label: "Open App Kit Swap",
      source: "Arc",
    },
    links: [
      {
        href: "https://developers.circle.com/stablefx",
        label: "Circle StableFX",
        source: "Circle",
      },
      {
        href: "https://docs.arc.io/app-kit/quickstarts/swap-tokens-crosschain",
        label: "Crosschain swap",
        source: "Arc",
      },
    ],
  },
  {
    id: "wallet-gasless",
    eyebrow: "Wallet UX",
    title: "Choose wallets, gas sponsorship, or USDC gas payment",
    summary:
      "Use Circle wallet docs when the product needs embedded wallets, passkeys, sponsored gas, or USDC-paid gas experiences.",
    outcome:
      "A wallet model that matches who holds keys, who pays gas, and how much control the app needs.",
    pathIds: ["payments", "production"],
    tags: ["Wallets", "Paymaster", "Gas UX"],
    checkpoints: [
      "Choose developer-controlled, user-controlled, or modular wallets.",
      "Use the right gas model for the wallet type.",
      "Avoid hiding custody tradeoffs from users.",
    ],
    primaryLink: {
      href: "https://developers.circle.com/wallets/infrastructure-models",
      label: "Choose wallet model",
      source: "Circle",
    },
    links: [
      {
        href: "https://developers.circle.com/paymaster",
        label: "Pay gas with USDC",
        source: "Circle",
      },
      {
        href: "https://developers.circle.com/wallets",
        label: "Circle Wallets",
        source: "Circle",
      },
    ],
  },
  {
    id: "agent-economy",
    eyebrow: "AI and agents",
    title: "Prototype agent identity and job settlement",
    summary:
      "This is the research lane for the future ArcRadar Agent page: identity, reputation, escrow, deliverables, and settlement.",
    outcome:
      "A concrete agent experiment with onchain identity, job terms, deliverable tracking, and settlement hooks.",
    pathIds: ["agents", "contracts"],
    tags: ["Agents", "Escrow", "Jobs"],
    checkpoints: [
      "Start with the Agentic Economy overview.",
      "Register an agent identity before modeling reputation.",
      "Use ERC-8183 job docs for escrow-style flows.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/build/agentic-economy",
      label: "Open agent overview",
      source: "Arc",
    },
    links: [
      {
        href: "https://docs.arc.io/arc/tutorials/register-your-first-ai-agent",
        label: "Register an agent",
        source: "Arc",
      },
      {
        href: "https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job",
        label: "Create ERC-8183 job",
        source: "Arc",
      },
    ],
  },
  {
    id: "infra-safety",
    eyebrow: "Production readiness",
    title: "Plan indexing, compliance, and operational safety",
    summary:
      "Before a project is treated as serious in ArcRadar, it needs reliable data, public links, monitoring, and a safety posture.",
    outcome:
      "A production checklist for RPC resilience, indexing, risk screens, explorer verification, and public status surfaces.",
    pathIds: ["production"],
    tags: ["Indexing", "Compliance", "Ops"],
    checkpoints: [
      "Pick indexers before relying on UI-only data.",
      "Use compliance providers when money movement becomes user-facing.",
      "Document known testnet limitations clearly.",
    ],
    primaryLink: {
      href: "https://docs.arc.io/arc/tools/data-indexers",
      label: "Open indexer docs",
      source: "Arc",
    },
    links: [
      {
        href: "https://docs.arc.io/arc/tools/node-providers",
        label: "Node providers",
        source: "Arc",
      },
      {
        href: "https://docs.arc.io/arc/tools/compliance-vendors",
        label: "Compliance vendors",
        source: "Arc",
      },
    ],
  },
];

export const builderChecklist = [
  "Can a new wallet connect to Arc and receive testnet USDC?",
  "Are ERC-20 USDC amounts and native gas fees displayed separately?",
  "Does every transaction path save a hash and link to ArcScan?",
  "Does the project have public website, GitHub, and social proof links?",
  "Is the project wallet configured before tipping is enabled?",
  "Are docs, caveats, and testnet-only assumptions visible to users?",
] as const;
