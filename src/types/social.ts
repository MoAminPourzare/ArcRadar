import type { Project } from "@/types/project";

export type SignalScoreBreakdown = {
  curation: number;
  social: number;
  tip: number;
  total: number;
  velocity: number;
};

export type ProjectTipMessage = {
  amountUsdc: number;
  id: string;
  message: string;
  timestamp: string;
  tipperAddress: `0x${string}`;
  transactionHash: `0x${string}`;
};

export type ProjectSocialSignal = {
  project: Project;
  score: SignalScoreBreakdown;
  tipMessages: ProjectTipMessage[];
};

export type EcosystemActivityItem = {
  amountUsdc?: number;
  href: string;
  id: string;
  message: string;
  projectName: string;
  projectSlug: string;
  timestamp: string;
  type: "curation" | "tip";
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
  hackathonTracks: HackathonTrack[];
  projects: ProjectSocialSignal[];
  stats: {
    tipMessageCount: number;
  };
};
