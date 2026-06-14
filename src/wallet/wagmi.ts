"use client";

import { fallback, http } from "viem";
import { createConfig, injected } from "wagmi";

import { arcRpcUrls, arcTestnet } from "@/config/arc";

const connectors = [
  injected({ shimDisconnect: true }),
];

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors,
  multiInjectedProviderDiscovery: true,
  ssr: true,
  transports: {
    [arcTestnet.id]: fallback(
      arcRpcUrls.map((url) =>
        http(url, {
          retryCount: 0,
          timeout: 8_000,
        }),
      ),
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
