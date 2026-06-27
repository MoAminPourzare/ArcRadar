export const ARC_READINESS_AUDIT_AGENT_ID = "arc_readiness_audit" as const;
export const TIP_ALLOCATION_AGENT_ID = "tip_allocation" as const;

export type AgentId =
  | typeof ARC_READINESS_AUDIT_AGENT_ID
  | typeof TIP_ALLOCATION_AGENT_ID;

export type AuditDepth = "full" | "quick";

export type AuditFindingStatus = "failed" | "passed" | "unverified" | "warning";

export type AuditFinding = {
  detail: string;
  evidence?: string;
  label: string;
  maxPoints: number;
  points: number;
  status: AuditFindingStatus;
};

export type AuditRecommendation = {
  detail: string;
  priority: "high" | "low" | "medium";
  title: string;
};

export type AuditScoreBreakdown = {
  activitySignal: number;
  arcSpecificProof: number;
  profileCompleteness: number;
  socialPresence: number;
  total: number;
  usdcTippingReadiness: number;
  websiteHealth: number;
};

export type ArcReadinessAuditReport = {
  depth: AuditDepth;
  evidence: {
    arcKeywords: string[];
    checkedAt: string;
    links: Array<{ href: string; label: string }>;
    tipRouter: {
      configured: boolean;
      matchesProjectWallet: boolean;
      recipient: string | null;
    };
    website: {
      finalUrl: string | null;
      httpStatus: number | null;
      ok: boolean;
      title: string | null;
      verified: boolean;
    };
  };
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  score: AuditScoreBreakdown;
  strengths: string[];
  summary: string;
};

export type AgentReportSummary = {
  agentId: AgentId;
  createdAt: string;
  evidence: Record<string, unknown>;
  findings: AuditFinding[];
  id: string;
  recommendations: AuditRecommendation[];
  runId: string;
  score: number | null;
  summary: string;
  title: string;
};

export type TipAllocationStrategy =
  | "ai_agents"
  | "balanced"
  | "payments_stack"
  | "rising_projects"
  | "top_signal"
  | "underfunded_builders";

export type TipAllocationProject = {
  amountUsdc: string;
  category: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  reason: string;
  score: number;
  walletAddress: `0x${string}`;
};

export type TipAllocationPlan = {
  allocations: TipAllocationProject[];
  budgetUsdc: string;
  generatedAt: string;
  maxProjects: number;
  strategy: TipAllocationStrategy;
  summary: string;
};
