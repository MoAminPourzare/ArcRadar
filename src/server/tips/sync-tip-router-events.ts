import { arcTestnet } from "@/config/arc";
import { tipRouterAbi } from "@/config/tip-router";
import { parseProjectId } from "@/lib/project-id";
import { projects, tipIndexerState, tips } from "@/server/db/schema";
import { loadLocalEnv } from "@/server/env/load-local-env";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  createPublicClient,
  fallback,
  getAddress,
  http,
  type Address,
  type Hash,
  type PublicClient,
} from "viem";

loadLocalEnv();

const INDEXER_ID = "tip-router";
const DEFAULT_BLOCK_RANGE = 50_000n;
const DEFAULT_CONFIRMATIONS = 2n;

type TipEvent = {
  amountUsdcMicro: bigint;
  blockNumber: bigint;
  message: string | null;
  projectSlug: string;
  recipientAddress: Address;
  tipperAddress: Address;
  transactionHash: Hash;
};

type TipEventReadResult = {
  events: TipEvent[];
  skippedInvalidProjectIds: number;
  skippedSelfTips: number;
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  const tipRouterAddress = getTipRouterAddress();

  if (!databaseUrl) {
    printSummary({
      ok: true,
      reason: "DATABASE_URL or DATABASE_URL_UNPOOLED is not configured.",
      skipped: true,
    });
    return;
  }

  if (!tipRouterAddress) {
    printSummary({
      ok: true,
      reason:
        "TIP_ROUTER_ADDRESS or NEXT_PUBLIC_TIP_ROUTER_ADDRESS is not configured.",
      skipped: true,
    });
    return;
  }

  const client = postgres(databaseUrl, { max: 1 });
  const database = drizzle(client);

  try {
    const configuredRpcUrl = process.env.ARC_TESTNET_RPC_URL;
    const rpcUrls = [
      ...(configuredRpcUrl ? [configuredRpcUrl] : []),
      ...arcTestnet.rpcUrls.default.http,
    ].filter((url, index, urls) => urls.indexOf(url) === index);
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: fallback(
        rpcUrls.map((url) =>
          http(url, {
            retryCount: 0,
            timeout: 8_000,
          }),
        ),
      ),
    });

    const summary = await syncTipRouterEvents({
      database,
      publicClient,
      tipRouterAddress,
    });

    printSummary(summary);
  } finally {
    await client.end();
  }
}

async function syncTipRouterEvents({
  database,
  publicClient,
  tipRouterAddress,
}: {
  database: ReturnType<typeof drizzle>;
  publicClient: PublicClient;
  tipRouterAddress: Address;
}) {
  const latestBlock = await publicClient.getBlockNumber();
  const confirmations = readBigIntEnv(
    "TIP_INDEXER_CONFIRMATIONS",
    DEFAULT_CONFIRMATIONS,
  );
  const safeToBlock = latestBlock > confirmations ? latestBlock - confirmations : 0n;
  const blockRange = readBigIntEnv("TIP_INDEXER_BLOCK_RANGE", DEFAULT_BLOCK_RANGE);
  const startBlock = readOptionalBigIntEnv("TIP_INDEXER_START_BLOCK");
  const [state] = await database
    .select()
    .from(tipIndexerState)
    .where(eq(tipIndexerState.id, INDEXER_ID))
    .limit(1);

  const stateMatchesContract =
    state?.contractAddress.toLowerCase() === tipRouterAddress.toLowerCase();

  if (!state && startBlock === undefined) {
    return {
      contractAddress: tipRouterAddress,
      latestBlock: latestBlock.toString(),
      ok: true,
      reason:
        "First sync needs TIP_INDEXER_START_BLOCK set to the TipRouter deployment block.",
      safeToBlock: safeToBlock.toString(),
      skipped: true,
    };
  }

  if (state && !stateMatchesContract && startBlock === undefined) {
    return {
      contractAddress: tipRouterAddress,
      indexedContractAddress: state.contractAddress,
      latestBlock: latestBlock.toString(),
      ok: true,
      reason:
        "TipRouter address changed. Set TIP_INDEXER_START_BLOCK for the new deployment.",
      safeToBlock: safeToBlock.toString(),
      skipped: true,
    };
  }

  const fromBlock =
    state && stateMatchesContract ? state.lastProcessedBlock + 1n : startBlock ?? 0n;

  if (fromBlock > safeToBlock) {
    await upsertIndexerState(database, tipRouterAddress, safeToBlock);

    return {
      contractAddress: tipRouterAddress,
      fromBlock: fromBlock.toString(),
      latestBlock: latestBlock.toString(),
      ok: true,
      safeToBlock: safeToBlock.toString(),
      skipped: true,
      upToDate: true,
    };
  }

  const eventReadResult = await readTipEventsInChunks({
    blockRange,
    fromBlock,
    publicClient,
    tipRouterAddress,
    toBlock: safeToBlock,
  });

  const inserted = await cacheTipEvents(
    database,
    publicClient,
    eventReadResult.events,
  );
  await upsertIndexerState(database, tipRouterAddress, safeToBlock);

  return {
    contractAddress: tipRouterAddress,
    eventsRead: eventReadResult.events.length,
    fromBlock: fromBlock.toString(),
    insertedTips: inserted.insertedTips,
    latestBlock: latestBlock.toString(),
    ok: true,
    safeToBlock: safeToBlock.toString(),
    skippedInvalidProjectIds: eventReadResult.skippedInvalidProjectIds,
    skippedSelfTips: eventReadResult.skippedSelfTips,
    skippedUnknownProjects: inserted.skippedUnknownProjects,
    skippedRecipientMismatches: inserted.skippedRecipientMismatches,
    toBlock: safeToBlock.toString(),
    recipientMismatches: inserted.recipientMismatches,
    unknownProjects: inserted.unknownProjects,
  };
}

async function readTipEventsInChunks({
  blockRange,
  fromBlock,
  publicClient,
  tipRouterAddress,
  toBlock,
}: {
  blockRange: bigint;
  fromBlock: bigint;
  publicClient: PublicClient;
  tipRouterAddress: Address;
  toBlock: bigint;
}): Promise<TipEventReadResult> {
  const events: TipEvent[] = [];
  let skippedInvalidProjectIds = 0;
  let skippedSelfTips = 0;
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    const chunkTo = minBigInt(cursor + blockRange - 1n, toBlock);
    const logs = await publicClient.getContractEvents({
      abi: tipRouterAbi,
      address: tipRouterAddress,
      eventName: "ProjectTipped",
      fromBlock: cursor,
      toBlock: chunkTo,
    });

    for (const log of logs) {
      const { amount, message, projectId, recipient, tipper } = log.args;

      if (
        amount === undefined ||
        !log.blockNumber ||
        !log.transactionHash ||
        !projectId ||
        !recipient ||
        !tipper
      ) {
        continue;
      }

      if (tipper.toLowerCase() === recipient.toLowerCase()) {
        skippedSelfTips += 1;
        continue;
      }

      const projectSlug = parseProjectId(projectId);

      if (!projectSlug) {
        skippedInvalidProjectIds += 1;
        continue;
      }

      events.push({
        amountUsdcMicro: amount,
        blockNumber: log.blockNumber,
        message: message || null,
        projectSlug,
        recipientAddress: getAddress(recipient),
        tipperAddress: getAddress(tipper),
        transactionHash: log.transactionHash,
      });
    }

    cursor = chunkTo + 1n;
  }

  return {
    events,
    skippedInvalidProjectIds,
    skippedSelfTips,
  };
}

async function cacheTipEvents(
  database: ReturnType<typeof drizzle>,
  publicClient: PublicClient,
  events: TipEvent[],
) {
  if (events.length === 0) {
    return {
      insertedTips: 0,
      skippedUnknownProjects: 0,
      unknownProjects: [],
    };
  }

  const projectSlugs = [...new Set(events.map((event) => event.projectSlug))];
  const projectRows = await database
    .select({
      id: projects.id,
      projectWallet: projects.projectWallet,
      slug: projects.slug,
    })
    .from(projects)
    .where(inArray(projects.slug, projectSlugs));
  const projectsBySlug = new Map(
    projectRows.map((project) => [
      project.slug,
      {
        id: project.id,
        projectWallet: project.projectWallet.toLowerCase(),
      },
    ]),
  );
  const blockTimestamps = await getBlockTimestamps(
    publicClient,
    events.map((event) => event.blockNumber),
  );
  const unknownProjects = [
    ...new Set(
      events
        .filter((event) => !projectsBySlug.has(event.projectSlug))
        .map((event) => event.projectSlug),
    ),
  ];
  const skippedUnknownProjects = events.filter(
    (event) => !projectsBySlug.has(event.projectSlug),
  ).length;
  const skippedRecipientMismatches = events.filter((event) => {
    const project = projectsBySlug.get(event.projectSlug);

    return (
      project && project.projectWallet !== event.recipientAddress.toLowerCase()
    );
  }).length;
  const recipientMismatches = [
    ...new Set(
      events
        .filter((event) => {
          const project = projectsBySlug.get(event.projectSlug);

          return (
            project &&
            project.projectWallet !== event.recipientAddress.toLowerCase()
          );
        })
        .map(
          (event) =>
            `${event.projectSlug}:${event.recipientAddress.toLowerCase()}`,
        ),
    ),
  ];
  const values = events
    .map((event) => {
      const project = projectsBySlug.get(event.projectSlug);

      if (!project) {
        return null;
      }

      if (project.projectWallet !== event.recipientAddress.toLowerCase()) {
        return null;
      }

      return {
        amountUsdcMicro: event.amountUsdcMicro,
        blockNumber: event.blockNumber,
        createdAt: blockTimestamps.get(event.blockNumber) ?? new Date(),
        message: event.message,
        projectId: project.id,
        recipientAddress: event.recipientAddress.toLowerCase(),
        tipperAddress: event.tipperAddress.toLowerCase(),
        transactionHash: event.transactionHash,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  if (values.length === 0) {
    return {
      insertedTips: 0,
      skippedUnknownProjects,
      skippedRecipientMismatches,
      recipientMismatches,
      unknownProjects,
    };
  }

  const inserted = await database
    .insert(tips)
    .values(values)
    .onConflictDoNothing({
      target: tips.transactionHash,
    })
    .returning({
      transactionHash: tips.transactionHash,
    });

  return {
    insertedTips: inserted.length,
    skippedUnknownProjects,
    skippedRecipientMismatches,
    recipientMismatches,
    unknownProjects,
  };
}

async function getBlockTimestamps(
  publicClient: PublicClient,
  blockNumbers: bigint[],
) {
  const timestamps = new Map<bigint, Date>();
  const uniqueBlocks = [...new Set(blockNumbers)];

  for (const blockNumber of uniqueBlocks) {
    const block = await publicClient.getBlock({ blockNumber });
    timestamps.set(blockNumber, new Date(Number(block.timestamp) * 1_000));
  }

  return timestamps;
}

async function upsertIndexerState(
  database: ReturnType<typeof drizzle>,
  tipRouterAddress: Address,
  lastProcessedBlock: bigint,
) {
  const now = new Date();

  await database
    .insert(tipIndexerState)
    .values({
      contractAddress: tipRouterAddress,
      id: INDEXER_ID,
      lastProcessedAt: now,
      lastProcessedBlock,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tipIndexerState.id,
      set: {
        contractAddress: tipRouterAddress,
        lastProcessedAt: now,
        lastProcessedBlock,
        updatedAt: now,
      },
    });
}

function getTipRouterAddress() {
  const configuredAddress =
    process.env.TIP_ROUTER_ADDRESS ?? process.env.NEXT_PUBLIC_TIP_ROUTER_ADDRESS;

  if (!configuredAddress || !/^0x[a-fA-F0-9]{40}$/.test(configuredAddress)) {
    return null;
  }

  return getAddress(configuredAddress);
}

function readBigIntEnv(name: string, fallback: bigint) {
  const value = readOptionalBigIntEnv(name);

  if (value === undefined) {
    return fallback;
  }

  return value;
}

function readOptionalBigIntEnv(name: string) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return undefined;
  }

  try {
    return BigInt(rawValue);
  } catch {
    throw new Error(`${name} must be an integer block number.`);
  }
}

function minBigInt(a: bigint, b: bigint) {
  return a < b ? a : b;
}

function printSummary(summary: Record<string, unknown>) {
  console.log(JSON.stringify(summary, null, 2));
}
