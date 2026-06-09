"use client";

import { http, createConfig } from "wagmi";
import { coinbaseWallet, injected, metaMask, walletConnect } from "wagmi/connectors";

import { arcTestnet } from "@/config/arc";
import { clientEnv } from "@/lib/env";
import { siteConfig } from "@/config/site";

const connectors = [
  injected({ shimDisconnect: true }),
  metaMask(),
  coinbaseWallet({ appName: siteConfig.name }),
];

if (clientEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId: clientEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
    }),
  );
}

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors,
  ssr: true,
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
