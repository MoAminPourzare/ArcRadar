import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SocialCommandCenter } from "@/components/social/social-command-center";
import { getProjects } from "@/server/projects/repository";
import { getSocialLayerData } from "@/server/social/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signals",
  description:
    "Explore ArcRadar signal scores, tip activity, and ecosystem context.",
};

export default async function SignalsPage() {
  const projects = await getProjects();
  const socialData = await getSocialLayerData(projects);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <SocialCommandCenter data={socialData} />
      </main>
      <SiteFooter />
    </div>
  );
}
