import { arcLinks } from "@/config/arc";

export const siteConfig = {
  name: "ArcRadar",
  description:
    "A discovery and tipping hub for builders shipping on Arc Testnet.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  brand: {
    mark: "/brand/arcradar-mark.png",
    socialImage: "/brand/arcradar-og.png",
    squareLogo: "/brand/arcradar-brand-square.png",
  },
  links: {
    docs: arcLinks.docs,
    explorer: arcLinks.explorer,
    faucet: arcLinks.faucet,
    status: arcLinks.status,
  },
} as const;
