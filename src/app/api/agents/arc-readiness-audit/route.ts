import { NextRequest, NextResponse } from "next/server";
import { parseEventLogs } from "viem";
import { z } from "zod";

import { agentPaymentConfig } from "@/config/agents";
import { arcContracts } from "@/config/arc";
import { parseProjectId } from "@/lib/project-id";
import { runArcReadinessAudit } from "@/server/agents/arc-readiness-audit";
import {
  getAgentReportByPaymentHash,
  mapAgentReport,
} from "@/server/agents/repository";
import { arcPublicClient } from "@/server/arc/public-client";
import { getDb } from "@/server/db/client";
import { agentReports, agentRuns, projects } from "@/server/db/schema";
import {
  getProjectTipData,
  getProjects,
} from "@/server/projects/repository";
import { checkRateLimit } from "@/server/security/rate-limit";
import { getSocialLayerData } from "@/server/social/repository";
import { ARC_READINESS_AUDIT_AGENT_ID } from "@/types/agent";
import { arcUsdcAbi } from "@/wallet/erc20";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
  auditDepth: z.enum(["full", "quick"]).default("full"),
  projectSlug: z.string().transform((value, context) => {
    const projectSlug = parseProjectId(value);

    if (!projectSlug) {
      context.addIssue({
        code: "custom",
        message: "Invalid project slug.",
      });

      return z.NEVER;
    }

    return projectSlug;
  }),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export async function POST(request: NextRequest) {
  const db = getDb();
  const rateLimit = checkRateLimit({
    key: `agent-audit:${getClientKey(request)}`,
    limit: 12,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return jsonResponse(
      { error: "Too many audit requests. Try again shortly." },
      429,
      { "Retry-After": rateLimit.retryAfterSeconds.toString() },
    );
  }

  if (!db) {
    return jsonResponse({ error: "Agent storage is not configured." }, 503);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = requestSchema.safeParse(body);

  if (!parsedBody.success) {
    return jsonResponse({ error: "Invalid audit request." }, 400);
  }

  const { auditDepth, projectSlug, transactionHash } = parsedBody.data;
  const transactionHashHex = transactionHash as `0x${string}`;
  const existingReport = await getAgentReportByPaymentHash(transactionHashHex);

  if (existingReport) {
    return jsonResponse({
      ok: true,
      report: existingReport,
      reused: true,
    });
  }

  const [projectRow] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
    })
    .from(projects)
    .where(eq(projects.slug, projectSlug))
    .limit(1);

  if (!projectRow) {
    return jsonResponse({ error: "The project is not published." }, 404);
  }

  const payment = await verifyAgentPayment(transactionHashHex);

  if (!payment.ok) {
    return jsonResponse({ error: payment.error }, payment.status);
  }

  let runId: string | null = null;

  try {
    const [run] = await db
      .insert(agentRuns)
      .values({
        agentId: ARC_READINESS_AUDIT_AGENT_ID,
        input: {
          auditDepth,
          projectSlug,
        },
        paymentAmountUsdcMicro: payment.amount,
        paymentTransactionHash: transactionHashHex,
        projectId: projectRow.id,
        status: "running",
        userWallet: payment.userWallet.toLowerCase(),
      })
      .returning({ id: agentRuns.id });

    runId = run.id;
    const auditRunId = run.id;

    const allProjects = await getProjects();
    const project = allProjects.find(
      (candidate) => candidate.slug === projectSlug,
    );

    if (!project) {
      throw new Error("The project could not be loaded for audit.");
    }

    const [tipData, socialData] = await Promise.all([
      getProjectTipData(project),
      getSocialLayerData(allProjects),
    ]);
    const socialSignal = socialData.projects.find(
      (signal) => signal.project.slug === project.slug,
    );
    const audit = await runArcReadinessAudit({
      depth: auditDepth,
      project,
      socialSignal,
      tipData,
    });

    const [report] = await db.transaction(async (transaction) => {
      const [insertedReport] = await transaction
        .insert(agentReports)
        .values({
          agentId: ARC_READINESS_AUDIT_AGENT_ID,
          evidence: audit.evidence,
          findings: audit.findings,
          projectId: projectRow.id,
          recommendations: audit.recommendations,
          runId: auditRunId,
          score: audit.score.total,
          summary: audit.summary,
          title: `${project.name} Arc readiness audit`,
        })
        .returning();

      await transaction
        .update(agentRuns)
        .set({
          completedAt: new Date(),
          output: audit,
          status: "completed",
        })
        .where(eq(agentRuns.id, auditRunId));

      return [insertedReport];
    });

    return jsonResponse({
      ok: true,
      report: mapAgentReport(report),
    });
  } catch (error) {
    if (runId) {
      await db
        .update(agentRuns)
        .set({
          completedAt: new Date(),
          error:
            error instanceof Error
              ? error.message
              : "The audit could not be completed.",
          status: "failed",
        })
        .where(eq(agentRuns.id, runId));
    }

    console.error("Arc readiness audit failed", {
      error,
      projectSlug,
      transactionHash,
    });

    return jsonResponse(
      { error: "The payment was confirmed, but the audit could not be completed." },
      503,
    );
  }
}

async function verifyAgentPayment(transactionHash: `0x${string}`) {
  try {
    const receipt = await arcPublicClient.getTransactionReceipt({
      hash: transactionHash,
    });

    if (receipt.status !== "success") {
      return {
        error: "The USDC payment transaction was reverted.",
        ok: false,
        status: 409,
      } as const;
    }

    const transferEvents = parseEventLogs({
      abi: arcUsdcAbi,
      eventName: "Transfer",
      logs: receipt.logs,
      strict: true,
    }).filter(
      (event) =>
        event.address.toLowerCase() === arcContracts.usdc.toLowerCase() &&
        event.args.to.toLowerCase() ===
          agentPaymentConfig.arcReadinessAudit.recipientAddress.toLowerCase() &&
        event.args.value >= agentPaymentConfig.arcReadinessAudit.priceUsdcMicro,
    );
    const transferEvent = transferEvents[0];

    if (!transferEvent) {
      return {
        error: `No matching ${agentPaymentConfig.arcReadinessAudit.priceLabel} USDC audit payment was found in this transaction.`,
        ok: false,
        status: 422,
      } as const;
    }

    return {
      amount: transferEvent.args.value,
      ok: true,
      userWallet: transferEvent.args.from,
    } as const;
  } catch {
    return {
      error: "The USDC payment could not be verified yet. Try again shortly.",
      ok: false,
      status: 503,
    } as const;
  }
}

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
    status,
  });
}
