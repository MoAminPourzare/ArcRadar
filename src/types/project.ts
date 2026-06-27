export type ProjectCategory =
  | "AI Agents"
  | "Blockchain"
  | "Dashboards"
  | "DEX"
  | "Payments"
  | "DeFi"
  | "Faucets"
  | "Games"
  | "Infrastructure"
  | "NFTs"
  | "Other"
  | "Security"
  | "Wallets"
  | "Developer Tools";

export type ProjectLink = {
  label: "Website" | "Project X" | "Builder X" | "GitHub";
  href: string;
};

export type ProjectActivity = {
  label: string;
  detail: string;
  timestamp: string;
};

export type ProjectProfile = {
  problem: string;
  solution: string;
  whyArc: string;
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
  leaderboard: ProjectTipperRank[];
  totalUsdc: number;
  weeklyUsdc: number;
};

export type LeaderboardProjectRow = {
  lastTippedAt: string | null;
  lastTransactionHash: `0x${string}` | null;
  project: Project;
  tipCount: number;
  totalUsdc: number;
};

export type TipperLeaderboardRow = {
  address: `0x${string}`;
  lastTippedAt: string;
  lastTransactionHash: `0x${string}` | null;
  projectCount: number;
  tipCount: number;
  totalUsdc: number;
};

export type EcosystemLeaderboardStats = {
  activeProjects: number;
  generatedAt: string;
  latestTipAt: string | null;
  totalTips: number;
  totalUsdc: number;
  uniqueTippers: number;
};

export type LeaderboardData = {
  recentProjects: LeaderboardProjectRow[];
  stats: EcosystemLeaderboardStats;
  topProjects: LeaderboardProjectRow[];
  topTippers: TipperLeaderboardRow[];
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  builder: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  walletAddress: `0x${string}` | null;
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
    rank: number;
    launches: number;
  };
};
