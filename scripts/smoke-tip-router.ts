import { arcContracts, arcTestnet } from "@/config/arc";
import { tipRouterAbi } from "@/config/tip-router";
import { loadLocalEnv } from "@/server/env/load-local-env";
import { arcUsdcAbi } from "@/wallet/erc20";
import {
  createPublicClient,
  createWalletClient,
  fallback,
  formatUnits,
  getAddress,
  http,
  isAddress,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

loadLocalEnv();

const projectSlug = process.env.TIP_SMOKE_PROJECT_SLUG ?? "arc-escrow";
const amount = parseUnits(process.env.TIP_SMOKE_AMOUNT_USDC ?? "0.01", 6);
const message = process.env.TIP_SMOKE_MESSAGE ?? "ArcRadar end-to-end test";
const privateKey = readPrivateKey();
const tipRouterAddress = readAddress(
  "TIP_ROUTER_ADDRESS",
  process.env.TIP_ROUTER_ADDRESS ?? process.env.NEXT_PUBLIC_TIP_ROUTER_ADDRESS,
);
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
  transport,
});

const [balance, allowance, recipient] = await Promise.all([
  publicClient.readContract({
    abi: arcUsdcAbi,
    address: arcContracts.usdc,
    args: [account.address],
    functionName: "balanceOf",
  }),
  publicClient.readContract({
    abi: arcUsdcAbi,
    address: arcContracts.usdc,
    args: [account.address, tipRouterAddress],
    functionName: "allowance",
  }),
  publicClient.readContract({
    abi: tipRouterAbi,
    address: tipRouterAddress,
    args: [projectSlug],
    functionName: "getProjectRecipient",
  }),
]);
const recipientBalanceBefore = await publicClient.readContract({
  abi: arcUsdcAbi,
  address: arcContracts.usdc,
  args: [recipient],
  functionName: "balanceOf",
});

if (amount <= 0n) {
  throw new Error("TIP_SMOKE_AMOUNT_USDC must be greater than zero.");
}

if (balance < amount) {
  throw new Error(
    `Insufficient Arc Testnet USDC. Balance: ${formatUnits(balance, 6)} USDC.`,
  );
}

if (recipient === "0x0000000000000000000000000000000000000000") {
  throw new Error(`Project ${projectSlug} is not registered in TipRouter.`);
}

let approvalTransactionHash: Hex | null = null;

if (allowance < amount) {
  const approval = await publicClient.simulateContract({
    abi: arcUsdcAbi,
    account,
    address: arcContracts.usdc,
    args: [tipRouterAddress, amount],
    functionName: "approve",
  });
  approvalTransactionHash = await walletClient.writeContract(approval.request);
  const approvalReceipt = await publicClient.waitForTransactionReceipt({
    confirmations: 2,
    hash: approvalTransactionHash,
  });

  if (approvalReceipt.status !== "success") {
    throw new Error("The Arc Testnet USDC approval transaction reverted.");
  }
}

const tip = await publicClient.simulateContract({
  abi: tipRouterAbi,
  account,
  address: tipRouterAddress,
  args: [projectSlug, amount, message],
  functionName: "tip",
});
const tipTransactionHash = await walletClient.writeContract(tip.request);
const tipReceipt = await publicClient.waitForTransactionReceipt({
  confirmations: 2,
  hash: tipTransactionHash,
});

if (tipReceipt.status !== "success") {
  throw new Error("The Arc Testnet tip transaction reverted.");
}

const [balanceAfter, recipientBalanceAfter] = await Promise.all([
  publicClient.readContract({
    abi: arcUsdcAbi,
    address: arcContracts.usdc,
    args: [account.address],
    functionName: "balanceOf",
  }),
  publicClient.readContract({
    abi: arcUsdcAbi,
    address: arcContracts.usdc,
    args: [recipient],
    functionName: "balanceOf",
  }),
]);

console.log(
  JSON.stringify(
    {
      account: account.address,
      amountUsdc: formatUnits(amount, 6),
      approvalTransactionHash,
      balanceAfterUsdc: formatUnits(balanceAfter, 6),
      balanceBeforeUsdc: formatUnits(balance, 6),
      blockNumber: tipReceipt.blockNumber.toString(),
      projectSlug,
      recipient,
      recipientBalanceAfterUsdc: formatUnits(recipientBalanceAfter, 6),
      recipientBalanceBeforeUsdc: formatUnits(recipientBalanceBefore, 6),
      tipTransactionHash,
      tipRouterAddress,
    },
    null,
    2,
  ),
);

function readPrivateKey() {
  const value = process.env.ARC_TESTNET_PRIVATE_KEY;

  if (!value || !/^0x[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error(
      "ARC_TESTNET_PRIVATE_KEY must be a 32-byte hex key in .env.local.",
    );
  }

  return value as Hex;
}

function readAddress(name: string, value: string | undefined) {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} must be a valid address in .env.local.`);
  }

  return getAddress(value) as Address;
}
