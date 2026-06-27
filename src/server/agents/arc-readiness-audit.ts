import { zeroAddress } from "viem";

import { tipRouterAbi, tipRouterAddress } from "@/config/tip-router";
import { arcPublicClient } from "@/server/arc/public-client";
import type {
  ArcReadinessAuditReport,
  AuditDepth,
  AuditFinding,
  AuditRecommendation,
  AuditScoreBreakdown,
} from "@/types/agent";
import type { Project, ProjectTipData } from "@/types/project";
import type { ProjectSocialSignal } from "@/types/social";

type AuditContext = {
  depth: AuditDepth;
  project: Project;
  socialSignal?: ProjectSocialSignal;
  tipData: ProjectTipData;
};

type WebsiteHealth = ArcReadinessAuditReport["evidence"]["website"];

const arcKeywordPatterns = [
  "agent",
  "arc",
  "circle",
  "gateway",
  "nano",
  "payment",
  "stablecoin",
  "testnet",
  "usdc",
  "x402",
] as const;

export async function runArcReadinessAudit({
  depth,
  project,
  socialSignal,
  tipData,
}: AuditContext): Promise<ArcReadinessAuditReport> {
  const [website, tipRouter] = await Promise.all([
    checkWebsiteHealth(getProjectWebsiteUrl(project)),
    checkTipRouterRecipient(project),
  ]);
  const textCorpus = buildProjectTextCorpus(project);
  const arcKeywords = findArcKeywords(textCorpus);
  const findings = [
    ...scoreProfileCompleteness(project),
    scoreWebsiteHealth(project, website),
    scoreSocialPresence(project),
    scoreUsdcTipping(project, tipData, tipRouter),
    scoreArcSpecificProof(project, arcKeywords),
    scoreActivitySignal(project, tipData, socialSignal),
  ];
  const score = buildScoreBreakdown(findings);
  const strengths = findings
    .filter((finding) => finding.status === "passed")
    .slice(0, 5)
    .map((finding) => finding.label);
  const recommendations = buildRecommendations({
    arcKeywords,
    findings,
    project,
    tipRouter,
    website,
  });
  const summary = buildSummary(project, score.total, findings);

  return {
    depth,
    evidence: {
      arcKeywords,
      checkedAt: new Date().toISOString(),
      links: project.links.map((link) => ({
        href: link.href,
        label: link.label,
      })),
      tipRouter,
      website,
    },
    findings,
    recommendations,
    score,
    strengths,
    summary,
  };
}

async function checkWebsiteHealth(websiteUrl: string | null | undefined) {
  if (!websiteUrl) {
    return {
      finalUrl: null,
      httpStatus: null,
      ok: false,
      title: null,
      verified: false,
    } satisfies WebsiteHealth;
  }

  const normalizedUrl = normalizeUrl(websiteUrl);

  if (!normalizedUrl) {
    return {
      finalUrl: websiteUrl,
      httpStatus: null,
      ok: false,
      title: null,
      verified: false,
    } satisfies WebsiteHealth;
  }

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "ArcRadarAuditAgent/1.0",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6_000),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const canReadBody = contentType.includes("text/html");
    const body = canReadBody ? await response.text() : "";

    return {
      finalUrl: response.url,
      httpStatus: response.status,
      ok: response.ok,
      title: extractTitle(body),
      verified: true,
    } satisfies WebsiteHealth;
  } catch {
    return {
      finalUrl: normalizedUrl,
      httpStatus: null,
      ok: false,
      title: null,
      verified: false,
    } satisfies WebsiteHealth;
  }
}

async function checkTipRouterRecipient(project: Project) {
  if (!tipRouterAddress || !project.walletAddress) {
    return {
      configured: Boolean(tipRouterAddress),
      matchesProjectWallet: false,
      recipient: null,
    };
  }

  try {
    const recipient = await arcPublicClient.readContract({
      abi: tipRouterAbi,
      address: tipRouterAddress,
      args: [project.slug],
      functionName: "getProjectRecipient",
    });

    return {
      configured: true,
      matchesProjectWallet:
        recipient !== zeroAddress &&
        recipient.toLowerCase() === project.walletAddress.toLowerCase(),
      recipient: recipient === zeroAddress ? null : recipient,
    };
  } catch {
    return {
      configured: true,
      matchesProjectWallet: false,
      recipient: null,
    };
  }
}

function scoreProfileCompleteness(project: Project): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const profileText = [
    project.profile.problem,
    project.profile.solution,
    project.profile.whyArc,
  ];
  const hasUsefulNarrative = profileText.every(
    (value) => value.trim().length >= 40,
  );

  findings.push({
    detail: project.logoUrl
      ? "A project logo is available for directory and profile surfaces."
      : "No project logo is available. Add a square official logo to improve trust and scanning.",
    label: "Project logo",
    maxPoints: 3,
    points: project.logoUrl ? 3 : 0,
    status: project.logoUrl ? "passed" : "warning",
  });
  findings.push({
    detail:
      project.tagline.trim().length >= 24
        ? "The tagline gives enough context for project cards."
        : "The tagline is too short to communicate the project clearly.",
    label: "Clear tagline",
    maxPoints: 2,
    points: project.tagline.trim().length >= 24 ? 2 : 0,
    status: project.tagline.trim().length >= 24 ? "passed" : "warning",
  });
  findings.push({
    detail:
      project.description.trim().length >= 100
        ? "The project description has enough detail for profile visitors."
        : "The project description should explain the use case, users, and Arc connection in more detail.",
    label: "Useful description",
    maxPoints: 4,
    points: project.description.trim().length >= 100 ? 4 : 2,
    status: project.description.trim().length >= 100 ? "passed" : "warning",
  });
  findings.push({
    detail: hasUsefulNarrative
      ? "Problem, solution, and Why Arc sections are populated."
      : "Problem, solution, or Why Arc sections need more specific builder context.",
    label: "Builder narrative",
    maxPoints: 6,
    points: hasUsefulNarrative ? 6 : 3,
    status: hasUsefulNarrative ? "passed" : "warning",
  });
  findings.push({
    detail:
      project.tags.length >= 2
        ? "The project has enough tags to power discovery."
        : "Add at least two tags to improve search and related-project matching.",
    label: "Discovery tags",
    maxPoints: 3,
    points: project.tags.length >= 2 ? 3 : 1,
    status: project.tags.length >= 2 ? "passed" : "warning",
  });
  findings.push({
    detail:
      project.builder.trim() && project.builder !== "Builder not listed"
        ? "A builder name is listed."
        : "The builder identity is not listed clearly.",
    label: "Builder identity",
    maxPoints: 2,
    points:
      project.builder.trim() && project.builder !== "Builder not listed" ? 2 : 0,
    status:
      project.builder.trim() && project.builder !== "Builder not listed"
        ? "passed"
        : "warning",
  });

  return findings;
}

function scoreWebsiteHealth(
  project: Project,
  website: WebsiteHealth,
): AuditFinding {
  let points = 0;
  const details: string[] = [];

  const websiteUrl = getProjectWebsiteUrl(project);

  if (websiteUrl) {
    points += 3;
    details.push("website URL is present");
  }

  if (websiteUrl?.startsWith("https://")) {
    points += 2;
    details.push("website uses HTTPS");
  }

  if (website.verified && website.ok) {
    points += 6;
    details.push(`website returned HTTP ${website.httpStatus}`);
  } else if (website.verified) {
    details.push(`website returned HTTP ${website.httpStatus ?? "unknown"}`);
  } else if (websiteUrl) {
    details.push("website could not be verified within the audit timeout");
  }

  if (website.title) {
    points += 2;
    details.push(`title detected: ${website.title}`);
  }

  if (website.title && isTextRelevantToProject(website.title, project)) {
    points += 2;
    details.push("website title appears project-related");
  }

  return {
    detail:
      details.length > 0
        ? details.join("; ")
        : "No project website is listed.",
    label: "Website health",
    maxPoints: 15,
    points,
    status:
      points >= 11
        ? "passed"
        : websiteUrl
          ? "warning"
          : "failed",
  };
}

function scoreSocialPresence(project: Project): AuditFinding {
  const labels = new Set(project.links.map((link) => link.label));
  let points = 0;

  if (labels.has("Website")) points += 2;
  if (labels.has("Project X") || labels.has("Builder X")) points += 3;
  if (labels.has("GitHub")) points += 3;
  if (project.links.length >= 3) points += 2;

  return {
    detail:
      project.links.length > 0
        ? `Found ${project.links.length} official link${project.links.length === 1 ? "" : "s"}.`
        : "No official social or source links are available.",
    label: "Social and source links",
    maxPoints: 10,
    points,
    status: points >= 7 ? "passed" : points > 0 ? "warning" : "failed",
  };
}

function scoreUsdcTipping(
  project: Project,
  tipData: ProjectTipData,
  tipRouter: ArcReadinessAuditReport["evidence"]["tipRouter"],
): AuditFinding {
  let points = 0;
  const details: string[] = [];

  if (project.walletAddress) {
    points += 5;
    details.push("project wallet is configured");
  }

  if (tipRouter.matchesProjectWallet) {
    points += 8;
    details.push("TipRouter recipient matches the project wallet");
  } else if (tipRouter.configured) {
    details.push("TipRouter registration could not be matched safely");
  }

  if (tipData.totalUsdc > 0) {
    points += 4;
    details.push(`${formatUsdc(tipData.totalUsdc)} indexed total tips`);
  }

  if (tipData.weeklyUsdc > 0) {
    points += 3;
    details.push(`${formatUsdc(tipData.weeklyUsdc)} indexed weekly tips`);
  }

  return {
    detail:
      details.length > 0
        ? details.join("; ")
        : "USDC tipping is not configured for this project yet.",
    label: "USDC tipping readiness",
    maxPoints: 20,
    points,
    status: points >= 15 ? "passed" : points > 0 ? "warning" : "failed",
  };
}

function scoreArcSpecificProof(
  project: Project,
  arcKeywords: string[],
): AuditFinding {
  const linkText = project.links.map((link) => link.href).join(" ");
  const hasArcScanLink =
    /arcscan\.app|testnet\.arcscan\.app/i.test(linkText) ||
    /0x[a-fA-F0-9]{40}/.test(buildProjectTextCorpus(project));
  const whyArcStrong =
    project.profile.whyArc.trim().length >= 50 &&
    /arc|usdc|circle|stablecoin|payment|testnet/i.test(project.profile.whyArc);
  const advancedArcFeature = /x402|gateway|agent|erc-8004|erc-8183|nano/i.test(
    buildProjectTextCorpus(project),
  );
  let points = 0;
  const details: string[] = [];

  if (arcKeywords.length > 0) {
    points += 5;
    details.push(`Arc-related keywords found: ${arcKeywords.join(", ")}`);
  }

  if (whyArcStrong) {
    points += 4;
    details.push("Why Arc section is specific enough");
  }

  if (hasArcScanLink) {
    points += 6;
    details.push("contract or ArcScan-style proof detected");
  } else {
    details.push("no ArcScan contract proof detected");
  }

  if (advancedArcFeature) {
    points += 3;
    details.push("advanced Arc/Circle feature keywords detected");
  }

  if (project.category === "Payments" || project.category === "AI Agents") {
    points += 2;
    details.push(`${project.category} aligns with Arc's payment/agent focus`);
  }

  return {
    detail: details.join("; "),
    label: "Arc-specific proof",
    maxPoints: 20,
    points,
    status: points >= 13 ? "passed" : points >= 6 ? "warning" : "failed",
  };
}

function scoreActivitySignal(
  project: Project,
  tipData: ProjectTipData,
  socialSignal?: ProjectSocialSignal,
): AuditFinding {
  let points = 0;
  const details: string[] = [];
  const signalScore = socialSignal?.score.total ?? 0;

  if (signalScore >= 50) {
    points += 5;
    details.push(`strong signal score: ${signalScore}/100`);
  } else if (signalScore >= 25) {
    points += 3;
    details.push(`moderate signal score: ${signalScore}/100`);
  }

  if (tipData.weeklyUsdc > 0) {
    points += 5;
    details.push("weekly tip activity detected");
  } else if (tipData.totalUsdc > 0) {
    points += 3;
    details.push("historical tip activity detected");
  }

  if (project.activity.length > 0) {
    points += 3;
    details.push(`${project.activity.length} profile activity item(s) listed`);
  }

  if (project.lastSignal && project.lastSignal !== "Indexed in ArcRadar") {
    points += 2;
    details.push(project.lastSignal);
  }

  return {
    detail:
      details.length > 0
        ? details.join("; ")
        : "No recent activity signal was found in ArcRadar yet.",
    label: "Activity signal",
    maxPoints: 15,
    points,
    status: points >= 10 ? "passed" : points > 0 ? "warning" : "failed",
  };
}

function buildScoreBreakdown(findings: AuditFinding[]): AuditScoreBreakdown {
  const find = (label: string) =>
    findings.find((finding) => finding.label === label)?.points ?? 0;
  const profileCompleteness = findings
    .filter((finding) =>
      [
        "Builder identity",
        "Builder narrative",
        "Clear tagline",
        "Discovery tags",
        "Project logo",
        "Useful description",
      ].includes(finding.label),
    )
    .reduce((total, finding) => total + finding.points, 0);
  const websiteHealth = find("Website health");
  const socialPresence = find("Social and source links");
  const usdcTippingReadiness = find("USDC tipping readiness");
  const arcSpecificProof = find("Arc-specific proof");
  const activitySignal = find("Activity signal");

  return {
    activitySignal,
    arcSpecificProof,
    profileCompleteness,
    socialPresence,
    total:
      profileCompleteness +
      websiteHealth +
      socialPresence +
      usdcTippingReadiness +
      arcSpecificProof +
      activitySignal,
    usdcTippingReadiness,
    websiteHealth,
  };
}

function buildRecommendations({
  arcKeywords,
  findings,
  project,
  tipRouter,
  website,
}: {
  arcKeywords: string[];
  findings: AuditFinding[];
  project: Project;
  tipRouter: ArcReadinessAuditReport["evidence"]["tipRouter"];
  website: WebsiteHealth;
}) {
  const recommendations: AuditRecommendation[] = [];
  const failedOrWeak = new Set(
    findings
      .filter((finding) => finding.status !== "passed")
      .map((finding) => finding.label),
  );

  if (!website.ok) {
    recommendations.push({
      detail:
        "Make sure the public website loads reliably and returns a successful HTTP status before sending builders or supporters to it.",
      priority: "high",
      title: "Fix the project website health",
    });
  }

  if (!project.logoUrl || failedOrWeak.has("Project logo")) {
    recommendations.push({
      detail:
        "Add a clean square logo so the project is recognizable across ArcRadar cards, radar views, and profile pages.",
      priority: "medium",
      title: "Add an official project logo",
    });
  }

  if (!project.links.some((link) => link.label === "GitHub")) {
    recommendations.push({
      detail:
        "A source, docs, or GitHub link gives builders and reviewers a concrete way to inspect the product.",
      priority: "medium",
      title: "Add a source or docs link",
    });
  }

  if (!project.walletAddress || !tipRouter.matchesProjectWallet) {
    recommendations.push({
      detail:
        "Configure a project wallet and register the project slug in TipRouter so USDC support is verifiable onchain.",
      priority: "high",
      title: "Complete USDC tipping setup",
    });
  }

  if (!hasContractProof(project)) {
    recommendations.push({
      detail:
        "Add an ArcScan contract link or deployed contract address so visitors can verify that the product has real Arc testnet activity.",
      priority: "high",
      title: "Add ArcScan contract proof",
    });
  }

  if (arcKeywords.length === 0 || !/arc|usdc|circle|stablecoin/i.test(project.profile.whyArc)) {
    recommendations.push({
      detail:
        "Explain exactly how the product uses Arc, USDC, payments, agents, or stablecoin-native infrastructure.",
      priority: "medium",
      title: "Clarify the Arc-specific value proposition",
    });
  }

  if (project.metrics.weeklyTipsUsdc === 0) {
    recommendations.push({
      detail:
        "Add a small call-to-action or builder note asking testers to send feedback-backed USDC support through ArcRadar.",
      priority: "low",
      title: "Create a fresh support signal",
    });
  }

  return recommendations.slice(0, 6);
}

function buildSummary(
  project: Project,
  totalScore: number,
  findings: AuditFinding[],
) {
  const failedCount = findings.filter(
    (finding) => finding.status === "failed",
  ).length;
  const warningCount = findings.filter(
    (finding) => finding.status === "warning",
  ).length;
  const readiness =
    totalScore >= 80 ? "strong" : totalScore >= 60 ? "promising" : "early";

  return `${project.name} looks ${readiness} for ArcRadar discovery with a ${totalScore}/100 readiness score. The audit found ${failedCount} critical gap${failedCount === 1 ? "" : "s"} and ${warningCount} improvement area${warningCount === 1 ? "" : "s"} to address before it feels mainnet-ready.`;
}

function findArcKeywords(text: string) {
  return arcKeywordPatterns.filter((keyword) =>
    new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(text),
  );
}

function buildProjectTextCorpus(project: Project) {
  return [
    project.name,
    project.tagline,
    project.description,
    project.category,
    project.profile.problem,
    project.profile.solution,
    project.profile.whyArc,
    ...project.tags,
    ...project.links.map((link) => `${link.label} ${link.href}`),
  ].join(" ");
}

function getProjectWebsiteUrl(project: Project) {
  return (
    project.websiteUrl ??
    project.links.find((link) => link.label === "Website")?.href ??
    null
  );
}

function hasContractProof(project: Project) {
  const text = buildProjectTextCorpus(project);

  return (
    /arcscan\.app|testnet\.arcscan\.app/i.test(text) ||
    /0x[a-fA-F0-9]{40}/.test(text)
  );
}

function isTextRelevantToProject(text: string, project: Project) {
  const normalizedText = text.toLowerCase();
  const projectWords = project.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3);

  return projectWords.some((word) => normalizedText.includes(word));
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function extractTitle(html: string) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();

  if (!title) {
    return null;
  }

  return title.replace(/\s+/g, " ").slice(0, 140);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatUsdc(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)} USDC`;
}
