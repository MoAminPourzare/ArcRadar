import type { Project } from "@/types/project";

export type SignalScoreBreakdown = {
  curation: number;
  social: number;
  tip: number;
  total: number;
  velocity: number;
};

export type ProjectSocialSignal = {
  project: Project;
  score: SignalScoreBreakdown;
};

export type SocialLayerData = {
  projects: ProjectSocialSignal[];
};
