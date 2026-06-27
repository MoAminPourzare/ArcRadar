import { NextRequest, NextResponse } from "next/server";
import { parseEventLogs, parseUnits } from "viem";
import { z } from "zod";

import { agentPaymentConfig } from "@/config/agents";
import { arcContracts } from "@/config/arc";
import { buildTipAllocationPlan } from "@/server/agents/tip-allocation";
import {
  getAgentReportByPaymentHash,
  mapAgentReport,
} from "@/server/agents/repository";
import { arcPublicClient } from "@/server/arc/public-client";
import { getDb } from "@/server/db/client";
import { agentReports, agentRuns } from "@/server/db/schema";
import { getProjects } from "@/server/projects/repository";
import { checkRateLimit } from "@/server/security/rate-limit";
import { getSocialLayerData } from "@/server/social/repository";
import {
  TIP_ALLOCATION_AGENT_ID,
  type TipAllocationPlan,
  type TipAllocationStrategy,
} from "@/types/agent";
import type { ProjectCategory } from "@/types/project";
import { arcUsdcAbi } from "@/wallet/erc20";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const categories = [
  "AI Agents",
  "Blockchain",
  "Dashboards",
  "DEX",
  "Payments",
  "DeFi",
  "Faucets",
  "Games",
  "Infrastructure",
  "NFTs",
  "Other",
  "Security",
  "Wallets",
  "Developer Tools",
] as const;

const requestSchema = z.object({
  budgetUsdc: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,6})?$/)
    .transform((value, context) => {
      try {
        const amount = parseUnits(value, 6);

        if (amount < 100_000n) {
          context.addIssue({
            code: "custom",
            message: "Budget must be at least 0.1 USDC.",
          });

          return z.NEVER;
        }

        return amount;
      } catch {
        context.addIssue({
          code: "custom",
          message: "Budget must be a valid USDC amount.",
        });

        return z.NEVER;
      }
    }),
  category: z.union([z.literal("All"), z.enum(categories)]).default("All"),
  maxProjects: z.number().int().min(3).max(5).default(5),
  strategy: z
    .enum([
      "ai_agents",
      "balanced",
      "payments_stack",
      "rising_projects",
      "top_signal",
      "underfunded_builders",
    ])
    .default("balanced"),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export async function POST(request: NextRequest) {
  const db = getDb();
  const rateLimit = checkRateLimit({
    key: `agent-tip-allocation:${getClientKey(request)}`,
    limit: 12,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return jsonResponse(
      { error: "Too many allocation requests. Try again shortly." },
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
    return jsonResponse({ error: "Invalid allocation request." }, 400);
  }

  const {
    budgetUsdc: budgetUsdcMicro,
    category,
    maxProjects,
    strategy,
    transactionHash,
  } = parsedBody.data;
  const transactionHashHex = transactionHash as `0x${string}`;
  const existingReport = await getAgentReportByPaymentHash(transactionHashHex);

  if (existingReport) {
    if (existingReport.agentId !== TIP_ALLOCATION_AGENT_ID) {
      return jsonResponse(
        { error: "This payment transaction was already used by another agent." },
        409,
      );
    }

    const existingPlan = getPlanFromReport(existingReport);

    if (!existingPlan) {
      return jsonResponse(
        { error: "The stored allocation plan could not be reused." },
        409,
      );
    }

    return jsonResponse({
      ok: true,
      plan: existingPlan,
      report: existingReport,
      reused: true,
    });
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
        agentId: TIP_ALLOCATION_AGENT_ID,
        input: {
          budgetUsdc: formatUsdcMicro(budgetUsdcMicro),
          category,
          maxProjects,
          strategy,
        },
        paymentAmountUsdcMicro: payment.amount,
        paymentTransactionHash: transactionHashHex,
        status: "running",
        userWallet: payment.userWallet.toLowerCase(),
      })
      .returning({ id: agentRuns.id });

    runId = run.id;

    const projects = await getProjects();
    const socialData = await getSocialLayerData(projects);
    const plan = buildTipAllocationPlan({
      budgetUsdcMicro,
      category: category as ProjectCategory | "All",
      maxProjects,
      projects,
      socialSignals: socialData.projects,
      strategy: strategy as TipAllocationStrategy,
    });
    const findings = plan.allocations.map((allocation) => ({
      detail: `${allocation.amountUsdc} USDC to ${allocation.projectName}. ${allocation.reason}`,
      label: allocation.projectName,
      maxPoints: 100,
      points: allocation.score,
      status: "passed" as const,
    }));
    const recommendations = plan.allocations.map((allocation) => ({
      detail:
        "Open the project profile, review the profile and latest signals, then approve the USDC tip manually.",
      priority: "medium" as const,
      title: `Review ${allocation.projectName}`,
    }));

    const [report] = await db.transaction(async (transaction) => {
      const [insertedReport] = await transaction
        .insert(agentReports)
        .values({
          agentId: TIP_ALLOCATION_AGENT_ID,
          evidence: {
            nanopaymentMode: "arc-testnet-usdc-transfer",
            plan,
          },
          findings,
          recommendations,
          runId: run.id,
          score: Math.round(
            plan.allocations.reduce(
              (total, allocation) => total + allocation.score,
              0,
            ) / plan.allocations.length,
          ),
          summary: plan.summary,
          title: "Autonomous tip allocation plan",
        })
        .returning();

      await transaction
        .update(agentRuns)
        .set({
          completedAt: new Date(),
          output: { plan },
          status: "completed",
        })
        .where(eq(agentRuns.id, run.id));

      return [insertedReport];
    });

    return jsonResponse({
      ok: true,
      plan,
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
              : "The allocation plan could not be completed.",
          status: "failed",
        })
        .where(eq(agentRuns.id, runId));
    }

    console.error("Tip allocation failed", {
      error,
      transactionHash,
    });

    return jsonResponse(
      {
        error:
          "The payment was confirmed, but the allocation plan could not be completed.",
      },
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
          agentPaymentConfig.tipAllocation.recipientAddress.toLowerCase() &&
        event.args.value >= agentPaymentConfig.tipAllocation.priceUsdcMicro,
    );
    const transferEvent = transferEvents[0];

    if (!transferEvent) {
      return {
        error: `No matching ${agentPaymentConfig.tipAllocation.priceLabel} USDC allocation micro-payment was found in this transaction.`,
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

function getPlanFromReport(report: { evidence: Record<string, unknown> }) {
  const plan = report.evidence.plan;

  return plan && typeof plan === "object"
    ? (plan as TipAllocationPlan)
    : undefined;
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

function formatUsdcMicro(value: bigint) {
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, "0");
  const visibleFraction = fraction.replace(/0+$/, "");

  return visibleFraction ? `${whole}.${visibleFraction}` : whole.toString();
}
