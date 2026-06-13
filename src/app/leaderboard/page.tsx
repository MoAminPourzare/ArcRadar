import type { Metadata } from "next";

import { Leaderboard } from "@/components/projects/leaderboard";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getProjects } from "@/server/projects/repository";
import { getLeaderboardData } from "@/server/tips/leaderboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Review indexed Arc Testnet project support and top tipping wallets.",
};

export default async function LeaderboardPage() {
  const projects = await getProjects();
  const leaderboardData = await getLeaderboardData(projects);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <Leaderboard data={leaderboardData} />
      </main>
      <SiteFooter />
    </div>
  );
}
