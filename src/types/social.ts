import type { Project } from "@/types/project";

export type ProjectSocialBadge = {
  description: string;
  label: string;
  tone: "amber" | "blueprint" | "coral" | "cyan" | "forest" | "ink" | "mint";
};

export type SignalScoreBreakdown = {
  curation: number;
  freshness: number;
  social: number;
  tip: number;
  total: number;
  velocity: number;
};

export type ProjectClaimStatus = "claim-ready" | "unclaimed" | "verified";

export type ProjectShoutout = {
  amountUsdc: number;
  id: string;
  message: string;
  timestamp: string;
  tipperAddress: `0x${string}`;
  transactionHash: `0x${string}`;
};

export type ProjectSocialSignal = {
  badges: ProjectSocialBadge[];
  claimStatus: ProjectClaimStatus;
  collections: string[];
  project: Project;
  score: SignalScoreBreakdown;
  shoutouts: ProjectShoutout[];
};

export type ProjectCollection = {
  accent: Project["accent"];
  description: string;
  id: string;
  projectSlugs: string[];
  title: string;
  track: string;
};

export type EcosystemActivityItem = {
  amountUsdc?: number;
  href: string;
  id: string;
  message: string;
  projectName: string;
  projectSlug: string;
  timestamp: string;
  type: "claim" | "collection" | "curation" | "tip";
  walletAddress?: `0x${string}`;
};

export type HackathonTrack = {
  description: string;
  id: string;
  projectSlugs: string[];
  title: string;
};

export type SocialLayerData = {
  activityFeed: EcosystemActivityItem[];
  collections: ProjectCollection[];
  hackathonTracks: HackathonTrack[];
  projects: ProjectSocialSignal[];
  stats: {
    claimReadyProfiles: number;
    collectionCount: number;
    shoutoutCount: number;
    verifiedBuilders: number;
  };
};
