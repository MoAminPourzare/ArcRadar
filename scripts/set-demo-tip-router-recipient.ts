import { arcTestnet } from "@/config/arc";
import { loadLocalEnv } from "@/server/env/load-local-env";
import {
  createPublicClient,
  createWalletClient,
  fallback,
  getAddress,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

loadLocalEnv();

const tipRouterAdminAbi = [
  {
    inputs: [],
    name: "owner",
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

const demoProjectSlugs = [
  "arc-escrow",
  "arc-commerce",
  "unified-usdc",
  "arc-router",
  "arc-index-kit",
  "arc-dev-console",
] as const;
const tipRouterAddress = readAddress(
  "TIP_ROUTER_ADDRESS",
  process.env.TIP_ROUTER_ADDRESS ?? process.env.NEXT_PUBLIC_TIP_ROUTER_ADDRESS,
);
const recipient = readAddress(
  "TIP_DEMO_RECIPIENT_ADDRESS",
  process.env.TIP_DEMO_RECIPIENT_ADDRESS,
);
const privateKey = readPrivateKey();
const account = privateKeyToAccount(privateKey);
const rpcUrls = [
  ...(process.env.ARC_TESTNET_RPC_URL
    ? [process.env.ARC_TESTNET_RPC_URL]
    : []),
  ...arcTestnet.rpcUrls.default.http,
].filter((url, index, urls) => urls.indexOf(url) === index);
const transport = fallback(
  rpcUrls.map((url) => http(url, { retryCount: 0, timeout: 10_000 })),
);
const publicClient = createPublicClient({ chain: arcTestnet, transport });
const walletClient = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http(rpcUrls[0], { retryCount: 1, timeout: 15_000 }),
});
const owner = await publicClient.readContract({
  abi: tipRouterAdminAbi,
  address: tipRouterAddress,
  functionName: "owner",
});

if (owner.toLowerCase() !== account.address.toLowerCase()) {
  throw new Error("ARC_TESTNET_PRIVATE_KEY is not the TipRouter owner.");
}

if (recipient.toLowerCase() === account.address.toLowerCase()) {
  throw new Error("The demo recipient must be different from the deployer wallet.");
}

const simulation = await publicClient.simulateContract({
  abi: tipRouterAdminAbi,
  account,
  address: tipRouterAddress,
  args: [demoProjectSlugs, demoProjectSlugs.map(() => recipient)],
  functionName: "setProjectRecipients",
});
const transactionHash = await walletClient.writeContract(simulation.request);
console.log(JSON.stringify({ broadcast: true, transactionHash }));
const receipt = await publicClient.waitForTransactionReceipt({
  confirmations: 1,
  hash: transactionHash,
  timeout: 90_000,
});

if (receipt.status !== "success") {
  throw new Error("Updating demo recipients reverted.");
}

const registeredRecipients = await Promise.all(
  demoProjectSlugs.map((projectSlug) =>
    publicClient.readContract({
      abi: tipRouterAdminAbi,
      address: tipRouterAddress,
      args: [projectSlug],
      functionName: "getProjectRecipient",
    }),
  ),
);

if (
  registeredRecipients.some(
    (registeredRecipient) =>
      registeredRecipient.toLowerCase() !== recipient.toLowerCase(),
  )
) {
  throw new Error("One or more TipRouter recipients failed verification.");
}

console.log(
  JSON.stringify(
    {
      projectsUpdated: demoProjectSlugs.length,
      recipient,
      transactionHash,
    },
    null,
    2,
  ),
);

function readPrivateKey() {
  const value = process.env.ARC_TESTNET_PRIVATE_KEY;

  if (!value || !/^0x[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error("ARC_TESTNET_PRIVATE_KEY must be configured in .env.local.");
  }

  return value as Hex;
}

function readAddress(name: string, value: string | undefined) {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} must be a valid address in .env.local.`);
  }

  return getAddress(value) as Address;
}
