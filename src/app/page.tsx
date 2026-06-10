import { HeroSection } from "@/components/home/hero-section";
import { ArcOnboarding } from "@/components/network/arc-onboarding";
import { Leaderboard } from "@/components/projects/leaderboard";
import { ProjectDirectory } from "@/components/projects/project-directory";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SocialCommandCenter } from "@/components/social/social-command-center";
import { ArcWalletConsole } from "@/components/wallet/arc-wallet-console";
import { getProjects } from "@/server/projects/repository";
import { getSocialLayerData } from "@/server/social/repository";
import { getLeaderboardData } from "@/server/tips/leaderboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjects();
  const leaderboardData = await getLeaderboardData(projects);
  const socialData = await getSocialLayerData(projects);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />

      <main>
        <HeroSection projects={projects} />
        <div id="network">
          <ArcOnboarding />
        </div>
        <ArcWalletConsole />
        <SocialCommandCenter data={socialData} />
        <ProjectDirectory projects={projects} socialSignals={socialData.projects} />
        <Leaderboard data={leaderboardData} />
      </main>

      <SiteFooter />
    </div>
  );
}
