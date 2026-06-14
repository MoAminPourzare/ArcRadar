import { NextRequest, NextResponse } from "next/server";
import { parseEventLogs } from "viem";
import { z } from "zod";

import { tipRouterAbi, tipRouterAddress } from "@/config/tip-router";
import { parseProjectId } from "@/lib/project-id";
import { arcPublicClient } from "@/server/arc/public-client";
import { getDb } from "@/server/db/client";
import { projects, tips } from "@/server/db/schema";
import { checkRateLimit } from "@/server/security/rate-limit";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
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
    key: `tip-confirm:${getClientKey(request)}`,
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return jsonResponse(
      { error: "Too many confirmation requests. Try again shortly." },
      429,
      { "Retry-After": rateLimit.retryAfterSeconds.toString() },
    );
  }

  if (!tipRouterAddress) {
    return jsonResponse({ error: "TipRouter is not configured." }, 503);
  }

  const configuredTipRouterAddress = tipRouterAddress;

  if (!db) {
    return jsonResponse({ error: "Tip storage is not configured." }, 503);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = requestSchema.safeParse(body);

  if (!parsedBody.success) {
    return jsonResponse({ error: "Invalid tip confirmation request." }, 400);
  }

  const { projectSlug, transactionHash } = parsedBody.data;

  try {
    const receipt = await arcPublicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    if (receipt.status !== "success") {
      return jsonResponse({ error: "The tip transaction was reverted." }, 409);
    }

    const tipEvents = parseEventLogs({
      abi: tipRouterAbi,
      eventName: "ProjectTipped",
      logs: receipt.logs,
      strict: true,
    }).filter(
      (event) =>
        event.address.toLowerCase() ===
          configuredTipRouterAddress.toLowerCase() &&
        event.args.projectId === projectSlug,
    );
    const tipEvent = tipEvents[0];

    if (!tipEvent) {
      return jsonResponse(
        { error: "No matching TipRouter event was found in this transaction." },
        422,
      );
    }

    if (
      tipEvent.args.tipper.toLowerCase() ===
      tipEvent.args.recipient.toLowerCase()
    ) {
      return jsonResponse(
        { error: "Self-tips are not counted as project support." },
        422,
      );
    }

    const [project] = await db
      .select({
        id: projects.id,
        projectWallet: projects.projectWallet,
      })
      .from(projects)
      .where(eq(projects.slug, projectSlug))
      .limit(1);

    if (!project) {
      return jsonResponse({ error: "The tipped project is not published." }, 404);
    }

    if (!project.projectWallet) {
      return jsonResponse(
        { error: "Tipping is not enabled for this project." },
        422,
      );
    }

    if (
      project.projectWallet.toLowerCase() !==
      tipEvent.args.recipient.toLowerCase()
    ) {
      return jsonResponse(
        { error: "The onchain recipient does not match the project wallet." },
        422,
      );
    }

    const block = await arcPublicClient.getBlock({
      blockNumber: receipt.blockNumber,
    });
    const [insertedTip] = await db
      .insert(tips)
      .values({
        amountUsdcMicro: tipEvent.args.amount,
        blockNumber: receipt.blockNumber,
        createdAt: new Date(Number(block.timestamp) * 1_000),
        message: tipEvent.args.message || null,
        projectId: project.id,
        recipientAddress: tipEvent.args.recipient.toLowerCase(),
        tipperAddress: tipEvent.args.tipper.toLowerCase(),
        transactionHash: receipt.transactionHash,
      })
      .onConflictDoNothing({ target: tips.transactionHash })
      .returning({ id: tips.id });

    return jsonResponse({
      indexed: Boolean(insertedTip),
      ok: true,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error("Tip confirmation failed", {
      error,
      projectSlug,
      transactionHash,
    });

    return jsonResponse(
      { error: "The confirmed tip could not be verified yet. Try again shortly." },
      503,
    );
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
