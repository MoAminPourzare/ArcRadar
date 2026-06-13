import { arcRpcUrls, arcTestnet } from "@/config/arc";
import { createPublicClient, fallback, http } from "viem";

const configuredRpcUrl = process.env.ARC_TESTNET_RPC_URL;
const rpcUrls = [
  ...(configuredRpcUrl ? [configuredRpcUrl] : []),
  ...arcRpcUrls,
].filter((url, index, urls) => urls.indexOf(url) === index);

export const arcPublicClient = createPublicClient({
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
