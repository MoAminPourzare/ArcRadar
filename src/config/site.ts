import { arcLinks } from "@/config/arc";

export const siteConfig = {
  name: "ArcRadar",
  description:
    "A discovery and tipping hub for builders shipping on Arc Testnet.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    docs: arcLinks.docs,
    explorer: arcLinks.explorer,
    faucet: arcLinks.faucet,
    status: arcLinks.status,
  },
} as const;
