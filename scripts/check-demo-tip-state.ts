import { arcContracts, arcTestnet } from "@/config/arc";
import { tipRouterAbi } from "@/config/tip-router";
import { loadLocalEnv } from "@/server/env/load-local-env";
import { arcUsdcAbi } from "@/wallet/erc20";
import {
  createPublicClient,
  fallback,
  formatUnits,
  getAddress,
  http,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

loadLocalEnv();

const projectSlug = process.env.TIP_SMOKE_PROJECT_SLUG ?? "arc-escrow";
const tipRouterAddress = readAddress(
  "TIP_ROUTER_ADDRESS",
  process.env.TIP_ROUTER_ADDRESS ?? process.env.NEXT_PUBLIC_TIP_ROUTER_ADDRESS,
);
const configuredRecipient = readAddress(
  "TIP_DEMO_RECIPIENT_ADDRESS",
  process.env.TIP_DEMO_RECIPIENT_ADDRESS,
);
const privateKey = process.env.ARC_TESTNET_PRIVATE_KEY;

if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
  throw new Error("ARC_TESTNET_PRIVATE_KEY must be configured in .env.local.");
}

const sender = privateKeyToAccount(privateKey as `0x${string}`).address;
const rpcUrls = [
  ...(process.env.ARC_TESTNET_RPC_URL
    ? [process.env.ARC_TESTNET_RPC_URL]
    : []),
  ...arcTestnet.rpcUrls.default.http,
].filter((url, index, urls) => urls.indexOf(url) === index);
const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: fallback(
    rpcUrls.map((url) => http(url, { retryCount: 0, timeout: 10_000 })),
  ),
});
const [registeredRecipient, senderBalance, recipientBalance, latestNonce, pendingNonce] =
  await Promise.all([
    publicClient.readContract({
      abi: tipRouterAbi,
      address: tipRouterAddress,
      args: [projectSlug],
      functionName: "getProjectRecipient",
    }),
    publicClient.readContract({
      abi: arcUsdcAbi,
      address: arcContracts.usdc,
      args: [sender],
      functionName: "balanceOf",
    }),
    publicClient.readContract({
      abi: arcUsdcAbi,
      address: arcContracts.usdc,
      args: [configuredRecipient],
      functionName: "balanceOf",
    }),
    publicClient.getTransactionCount({ address: sender, blockTag: "latest" }),
    publicClient.getTransactionCount({ address: sender, blockTag: "pending" }),
  ]);

console.log(
  JSON.stringify(
    {
      configuredRecipient,
      latestNonce,
      pendingNonce,
      projectSlug,
      recipientBalanceUsdc: formatUnits(recipientBalance, 6),
      recipientMatchesConfiguration:
        registeredRecipient.toLowerCase() === configuredRecipient.toLowerCase(),
      registeredRecipient,
      sender,
      senderBalanceUsdc: formatUnits(senderBalance, 6),
    },
    null,
    2,
  ),
);

function readAddress(name: string, value: string | undefined) {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} must be a valid address in .env.local.`);
  }

  return getAddress(value);
}
