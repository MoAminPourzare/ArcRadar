import type { ProjectCategory } from "@/types/project";
import type { HackathonTrack } from "@/types/social";

export const hackathonTrackDefinitions: Array<
  Omit<HackathonTrack, "projectSlugs"> & {
    categories?: ProjectCategory[];
    tags?: string[];
  }
> = [
  {
    categories: ["AI Agents", "Payments"],
    description:
      "Build around agent jobs, checkout flows, and message-rich USDC support loops.",
    id: "agentic-usdc-sprint",
    tags: ["Agents", "Escrow", "Checkout"],
    title: "Agentic USDC Sprint",
  },
  {
    categories: ["Infrastructure", "Developer Tools"],
    description:
      "Ship indexers, deploy helpers, explorer shortcuts, and project analytics surfaces.",
    id: "builder-ops-track",
    tags: ["Indexer", "Events", "Deploy", "Config"],
    title: "Builder Ops Track",
  },
  {
    categories: ["DeFi", "Wallets"],
    description:
      "Prototype treasury movement, wallet policy, balance UX, and safer routing ideas.",
    id: "stablecoin-ops-track",
    tags: ["Treasury", "Gateway", "Routing", "Vaults"],
    title: "Stablecoin Ops Track",
  },
];
