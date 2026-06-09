export type ProjectStatus = "live" | "testnet" | "building" | "watchlist";

export type ProjectStage =
  | "Prototype"
  | "Public Testnet"
  | "Community"
  | "Partner"
  | "Research";

export type ProjectCategory =
  | "AI Agents"
  | "Payments"
  | "DeFi"
  | "Infrastructure"
  | "Wallets"
  | "Developer Tools";

export type ProjectLink = {
  label: "Website" | "X" | "Discord" | "GitHub" | "Docs" | "Explorer";
  href: string;
};

export type ProjectMilestoneStatus = "done" | "building" | "planned";

export type ProjectMilestone = {
  label: string;
  status: ProjectMilestoneStatus;
};

export type ProjectActivity = {
  label: string;
  detail: string;
  timestamp: string;
};

export type ProjectProfile = {
  builderNote: string;
  problem: string;
  solution: string;
  whyArc: string;
  idealFor: string[];
  roadmap: ProjectMilestone[];
  curationNotes: string[];
};

export type ProjectTip = {
  amountUsdc: number;
  id: string;
  message: string;
  projectSlug: string;
  timestamp: string;
  tipperAddress: `0x${string}`;
  transactionHash: `0x${string}`;
};

export type ProjectTipperRank = {
  address: `0x${string}`;
  tipCount: number;
  totalUsdc: number;
};

export type ProjectTipData = {
  latestTips: ProjectTip[];
  leaderboard: ProjectTipperRank[];
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  stage: ProjectStage;
  builder: string;
  walletAddress: `0x${string}`;
  links: ProjectLink[];
  tags: string[];
  featured?: boolean;
  accent: "mint" | "cyan" | "amber" | "coral" | "blueprint";
  lastSignal: string;
  profile: ProjectProfile;
  activity: ProjectActivity[];
  metrics: {
    tipsUsdc: number;
    weeklyTipsUsdc: number;
    supporters: number;
    rank: number;
    signalScore: number;
    launches: number;
  };
};
