import { HeroSection } from "@/components/home/hero-section";
import { ArcOnboarding } from "@/components/network/arc-onboarding";
import { Leaderboard } from "@/components/projects/leaderboard";
import { ProjectDirectory } from "@/components/projects/project-directory";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ArcWalletConsole } from "@/components/wallet/arc-wallet-console";
import { getProjects } from "@/server/projects/repository";
import { getLeaderboardData } from "@/server/tips/leaderboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjects();
  const leaderboardData = await getLeaderboardData(projects);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />

      <main>
        <HeroSection projects={projects} />
        <div id="network">
          <ArcOnboarding />
        </div>
        <ArcWalletConsole />
        <ProjectDirectory projects={projects} />
        <Leaderboard data={leaderboardData} />
      </main>

      <SiteFooter />
    </div>
  );
}
