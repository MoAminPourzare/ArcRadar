import type {
  TipAllocationPlan,
  TipAllocationStrategy,
} from "@/types/agent";
import type { Project, ProjectCategory } from "@/types/project";
import type { ProjectSocialSignal } from "@/types/social";

type TipAllocationInput = {
  budgetUsdcMicro: bigint;
  category?: ProjectCategory | "All";
  maxProjects: number;
  projects: Project[];
  socialSignals?: ProjectSocialSignal[];
  strategy: TipAllocationStrategy;
};

type Candidate = {
  profileScore: number;
  project: Project;
  reason: string;
  score: number;
  signalScore: number;
};

const strategyLabels: Record<TipAllocationStrategy, string> = {
  ai_agents: "AI agent projects",
  balanced: "balanced ecosystem support",
  payments_stack: "Arc payments stack",
  rising_projects: "rising projects",
  top_signal: "top signal projects",
  underfunded_builders: "underfunded builders",
};

export function buildTipAllocationPlan({
  budgetUsdcMicro,
  category = "All",
  maxProjects,
  projects,
  socialSignals = [],
  strategy,
}: TipAllocationInput): TipAllocationPlan {
  const socialBySlug = new Map(
    socialSignals.map((signal) => [signal.project.slug, signal]),
  );
  const eligibleProjects = projects.filter((project) => {
    if (!project.walletAddress) {
      return false;
    }

    if (category !== "All" && project.category !== category) {
      return false;
    }

    if (strategy === "ai_agents" && project.category !== "AI Agents") {
      return false;
    }

    if (
      strategy === "payments_stack" &&
      !["Payments", "Wallets", "DeFi", "DEX"].includes(project.category)
    ) {
      return false;
    }

    return getProfileCompleteness(project) >= 45;
  });

  if (eligibleProjects.length === 0) {
    throw new Error("No eligible projects were found for this allocation.");
  }

  const candidateCount = clamp(maxProjects, 3, 5);
  const candidates = eligibleProjects
    .map((project) =>
      scoreCandidate({
        project,
        signalScore: socialBySlug.get(project.slug)?.score.total ?? 0,
        strategy,
      }),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(candidateCount, eligibleProjects.length));
  const totalScore = candidates.reduce(
    (total, candidate) => total + candidate.score,
    0,
  );
  const rawAllocations = candidates.map((candidate) => ({
    amount:
      totalScore > 0
        ? (budgetUsdcMicro * BigInt(Math.round(candidate.score * 1000))) /
          BigInt(Math.round(totalScore * 1000))
        : budgetUsdcMicro / BigInt(candidates.length),
    candidate,
  }));
  const allocated = rawAllocations.reduce(
    (total, allocation) => total + allocation.amount,
    0n,
  );
  let remainder = budgetUsdcMicro - allocated;

  for (const allocation of rawAllocations) {
    if (remainder <= 0n) {
      break;
    }

    allocation.amount += 1n;
    remainder -= 1n;
  }

  const allocations = rawAllocations.map(({ amount, candidate }) => ({
    amountUsdc: formatUsdcMicro(amount),
    category: candidate.project.category,
    projectId: candidate.project.id,
    projectName: candidate.project.name,
    projectSlug: candidate.project.slug,
    reason: candidate.reason,
    score: Math.round(candidate.score),
    walletAddress: candidate.project.walletAddress as `0x${string}`,
  }));

  return {
    allocations,
    budgetUsdc: formatUsdcMicro(budgetUsdcMicro),
    generatedAt: new Date().toISOString(),
    maxProjects: candidateCount,
    strategy,
    summary: `Allocated ${formatUsdcMicro(
      budgetUsdcMicro,
    )} USDC across ${allocations.length} ${strategyLabels[strategy]} using ArcRadar signal, funding, and profile quality data.`,
  };
}

function scoreCandidate({
  project,
  signalScore,
  strategy,
}: {
  project: Project;
  signalScore: number;
  strategy: TipAllocationStrategy;
}): Candidate {
  const profileScore = getProfileCompleteness(project);
  const totalTips = project.metrics.tipsUsdc;
  const weeklyTips = project.metrics.weeklyTipsUsdc;
  const underfundedScore = clamp(100 - totalTips * 4, 8, 100);
  const weeklyMomentum = weeklyTips > 0 ? clamp(35 + weeklyTips * 12, 35, 100) : 15;
  const base =
    signalScore * 0.32 +
    profileScore * 0.22 +
    weeklyMomentum * 0.18 +
    underfundedScore * 0.18 +
    getCategoryFit(project, strategy) * 0.1;
  const score = applyStrategyWeight(base, {
    profileScore,
    project,
    signalScore,
    strategy,
    underfundedScore,
    weeklyMomentum,
  });

  return {
    profileScore,
    project,
    reason: buildReason({
      project,
      signalScore,
      strategy,
      underfundedScore,
      weeklyMomentum,
    }),
    score,
    signalScore,
  };
}

function applyStrategyWeight(
  base: number,
  {
    project,
    signalScore,
    strategy,
    underfundedScore,
    weeklyMomentum,
  }: {
    profileScore: number;
    project: Project;
    signalScore: number;
    strategy: TipAllocationStrategy;
    underfundedScore: number;
    weeklyMomentum: number;
  },
) {
  if (strategy === "rising_projects") {
    return base + weeklyMomentum * 0.35 + signalScore * 0.15;
  }

  if (strategy === "underfunded_builders") {
    return base + underfundedScore * 0.45;
  }

  if (strategy === "top_signal") {
    return base + signalScore * 0.5;
  }

  if (strategy === "ai_agents" && project.category === "AI Agents") {
    return base + 35;
  }

  if (
    strategy === "payments_stack" &&
    ["Payments", "Wallets", "DeFi", "DEX"].includes(project.category)
  ) {
    return base + 28;
  }

  return base;
}

function getCategoryFit(project: Project, strategy: TipAllocationStrategy) {
  if (strategy === "ai_agents") {
    return project.category === "AI Agents" ? 100 : 0;
  }

  if (strategy === "payments_stack") {
    return ["Payments", "Wallets", "DeFi", "DEX"].includes(project.category)
      ? 100
      : 0;
  }

  return 55;
}

function getProfileCompleteness(project: Project) {
  let score = 0;

  if (project.logoUrl) score += 15;
  if (project.websiteUrl || project.links.some((link) => link.label === "Website")) {
    score += 15;
  }
  if (project.links.some((link) => link.label === "Project X")) score += 10;
  if (project.links.some((link) => link.label === "Builder X")) score += 8;
  if (project.links.some((link) => link.label === "GitHub")) score += 10;
  if (project.description.length >= 100) score += 12;
  if (project.profile.whyArc.length >= 40) score += 12;
  if (project.tags.length >= 2) score += 8;
  if (project.builder && project.builder !== "Builder not listed") score += 10;

  return clamp(score, 0, 100);
}

function buildReason({
  project,
  signalScore,
  strategy,
  underfundedScore,
  weeklyMomentum,
}: {
  project: Project;
  signalScore: number;
  strategy: TipAllocationStrategy;
  underfundedScore: number;
  weeklyMomentum: number;
}) {
  if (strategy === "underfunded_builders" && underfundedScore >= 70) {
    return "Strong fit for underfunded support: the project has enough profile quality but still has low indexed total support.";
  }

  if (strategy === "rising_projects" && weeklyMomentum >= 50) {
    return "Selected for recent momentum: weekly USDC support and ArcRadar signal suggest rising attention.";
  }

  if (strategy === "top_signal" && signalScore >= 50) {
    return "Selected for high signal: this project ranks well across curation, social, tip, and velocity data.";
  }

  if (strategy === "ai_agents") {
    return "Selected because it fits the AI Agents category and has enough public profile context for discovery.";
  }

  if (strategy === "payments_stack") {
    return `Selected as part of the Arc payments stack because it is listed under ${project.category}.`;
  }

  return "Balanced pick based on profile completeness, ArcRadar signal, funding level, and category fit.";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatUsdcMicro(value: bigint) {
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, "0");
  const visibleFraction = fraction.replace(/0+$/, "");

  return visibleFraction ? `${whole}.${visibleFraction}` : whole.toString();
}
