import { arcContracts, arcTestnet } from "@/config/arc";
import { loadLocalEnv } from "@/server/env/load-local-env";
import postgres from "postgres";
import {
  createPublicClient,
  createWalletClient,
  fallback,
  formatEther,
  getAddress,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

loadLocalEnv();

const checkOnly = process.argv.includes("--check");
const batchSize = readBatchSize();
const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const tipRouterAddress = readAddress(
  "TIP_ROUTER_ADDRESS",
  process.env.TIP_ROUTER_ADDRESS ?? process.env.NEXT_PUBLIC_TIP_ROUTER_ADDRESS,
);
const recipient = readAddress(
  "PROJECT_TIP_RECIPIENT_ADDRESS",
  process.env.PROJECT_TIP_RECIPIENT_ADDRESS ??
    process.env.TIP_DEMO_RECIPIENT_ADDRESS,
);

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required.");
}

const rpcUrls = [
  ...(process.env.ARC_TESTNET_RPC_URL
    ? [process.env.ARC_TESTNET_RPC_URL]
    : []),
  ...arcTestnet.rpcUrls.default.http,
].filter((url, index, urls) => urls.indexOf(url) === index);
const transport = fallback(
  rpcUrls.map((url) => http(url, { retryCount: 1, timeout: 15_000 })),
);
const publicClient = createPublicClient({ chain: arcTestnet, transport });
const database = postgres(databaseUrl, { max: 1 });

const tipRouterAdminAbi = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "projectId", type: "string" }],
    name: "getProjectRecipient",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "projectIds", type: "string[]" },
      { name: "recipients", type: "address[]" },
    ],
    name: "setProjectRecipients",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

try {
  const projects = await database<
    Array<{ project_wallet: string | null; slug: string }>
  >`select slug, project_wallet from projects order by slug`;

  if (projects.length === 0) {
    throw new Error("No curated projects were found in the database.");
  }

  const [owner, configuredUsdc] = await Promise.all([
    publicClient.readContract({
      abi: tipRouterAdminAbi,
      address: tipRouterAddress,
      functionName: "owner",
    }),
    publicClient.readContract({
      abi: tipRouterAdminAbi,
      address: tipRouterAddress,
      functionName: "usdc",
    }),
  ]);

  if (configuredUsdc.toLowerCase() !== arcContracts.usdc.toLowerCase()) {
    throw new Error(
      `TipRouter USDC mismatch: expected ${arcContracts.usdc}, received ${configuredUsdc}.`,
    );
  }

  const registrations = new Map<string, Address>();

  for (const batch of chunk(projects, 20)) {
    const recipients = await Promise.all(
      batch.map((project) =>
        publicClient.readContract({
          abi: tipRouterAdminAbi,
          address: tipRouterAddress,
          args: [project.slug],
          functionName: "getProjectRecipient",
        }),
      ),
    );

    batch.forEach((project, index) => {
      registrations.set(project.slug, recipients[index]);
    });
  }

  const recipientLower = recipient.toLowerCase();
  const chainMismatches = projects.filter(
    (project) =>
      registrations.get(project.slug)?.toLowerCase() !== recipientLower,
  );
  const databaseMismatches = projects.filter(
    (project) => project.project_wallet?.toLowerCase() !== recipientLower,
  );

  console.log(
    JSON.stringify(
      {
        checkOnly,
        databaseMismatches: databaseMismatches.length,
        onchainMismatches: chainMismatches.length,
        owner,
        projects: projects.length,
        recipient,
        tipRouter: tipRouterAddress,
        usdc: configuredUsdc,
      },
      null,
      2,
    ),
  );

  if (checkOnly) {
    process.exitCode =
      chainMismatches.length === 0 && databaseMismatches.length === 0 ? 0 : 1;
  } else {
    const privateKey = readPrivateKey();
    const account = privateKeyToAccount(privateKey);

    if (account.address.toLowerCase() !== owner.toLowerCase()) {
      throw new Error(
        `ARC_TESTNET_PRIVATE_KEY controls ${account.address}, but TipRouter is owned by ${owner}.`,
      );
    }

    const nativeBalance = await publicClient.getBalance({
      address: account.address,
    });

    if (nativeBalance === 0n && chainMismatches.length > 0) {
      throw new Error("The TipRouter owner wallet has no Arc Testnet gas balance.");
    }

    console.log(
      `Owner ${account.address} has ${formatEther(nativeBalance)} native USDC for gas.`,
    );

    const walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport,
    });

    for (const [index, batch] of chunk(chainMismatches, batchSize).entries()) {
      const slugs = batch.map((project) => project.slug);
      const recipients = slugs.map(() => recipient);
      const simulation = await publicClient.simulateContract({
        abi: tipRouterAdminAbi,
        account,
        address: tipRouterAddress,
        args: [slugs, recipients],
        functionName: "setProjectRecipients",
      });
      const transactionHash = await walletClient.writeContract(
        simulation.request,
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        confirmations: 2,
        hash: transactionHash,
      });

      if (receipt.status !== "success") {
        throw new Error(`Registration batch ${index + 1} reverted.`);
      }

      console.log(
        `Registered batch ${index + 1}: ${slugs.length} projects (${transactionHash}).`,
      );
    }

    await database.begin(async (transaction) => {
      for (const project of projects) {
        await transaction`
          update projects
          set project_wallet = ${recipientLower}, updated_at = now()
          where slug = ${project.slug}
        `;
      }
    });

    const finalDatabaseRows = await database<
      Array<{ project_wallet: string | null; slug: string }>
    >`select slug, project_wallet from projects order by slug`;
    const finalChainRecipients = new Map<string, Address>();

    for (const batch of chunk(finalDatabaseRows, 20)) {
      const recipients = await Promise.all(
        batch.map((project) =>
          publicClient.readContract({
            abi: tipRouterAdminAbi,
            address: tipRouterAddress,
            args: [project.slug],
            functionName: "getProjectRecipient",
          }),
        ),
      );

      batch.forEach((project, index) => {
        finalChainRecipients.set(project.slug, recipients[index]);
      });
    }

    const invalidProjects = finalDatabaseRows.filter(
      (project) =>
        project.project_wallet?.toLowerCase() !== recipientLower ||
        finalChainRecipients.get(project.slug)?.toLowerCase() !== recipientLower,
    );

    if (invalidProjects.length > 0) {
      throw new Error(
        `Tipping verification failed for ${invalidProjects.length} projects.`,
      );
    }

    console.log(
      JSON.stringify(
        {
          configuredProjects: finalDatabaseRows.length,
          databaseMatches: finalDatabaseRows.length,
          onchainMatches: finalChainRecipients.size,
          recipient,
          status: "ready",
        },
        null,
        2,
      ),
    );
  }
} finally {
  await database.end();
}

function chunk<T>(values: T[], size: number) {
  const batches: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    batches.push(values.slice(index, index + size));
  }

  return batches;
}

function readAddress(name: string, value: string | undefined) {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} must be a valid address in .env.local.`);
  }

  return getAddress(value) as Address;
}

function readBatchSize() {
  const argument = process.argv.find((value) => value.startsWith("--batch-size="));
  const value = Number(argument?.split("=")[1] ?? "20");

  if (!Number.isInteger(value) || value < 1 || value > 30) {
    throw new Error("--batch-size must be an integer between 1 and 30.");
  }

  return value;
}

function readPrivateKey() {
  const value = process.env.ARC_TESTNET_PRIVATE_KEY;

  if (!value || !/^0x[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error(
      "ARC_TESTNET_PRIVATE_KEY must be a 32-byte hex key in .env.local.",
    );
  }

  return value as Hex;
}
