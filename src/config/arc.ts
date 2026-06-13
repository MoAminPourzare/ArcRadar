import { defineChain } from "viem";

export const arcRpcUrls = [
  "https://rpc.testnet.arc.network",
  "https://rpc.blockdaemon.testnet.arc.network",
  "https://rpc.drpc.testnet.arc.network",
  "https://rpc.quicknode.testnet.arc.network",
] as const;

export const arcTestnet = defineChain({
  id: 5_042_002,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: [...arcRpcUrls],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

export const arcContracts = {
  usdc: "0x3600000000000000000000000000000000000000",
} as const;

export const arcCurrency = {
  erc20UsdcDecimals: 6,
  nativeUsdcDecimals: 18,
  symbol: "USDC",
} as const;

export const arcLinks = {
  docs: "https://docs.arc.io",
  explorer: "https://testnet.arcscan.app",
  faucet: "https://faucet.circle.com",
  status: "https://status.arc.io",
} as const;
