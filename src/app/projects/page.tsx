import type { Metadata } from "next";

import { ProjectDirectory } from "@/components/projects/project-directory";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getProjects } from "@/server/projects/repository";
import { getSocialLayerData } from "@/server/social/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: "Browse curated projects and builders shipping on Arc Testnet.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  const socialData = await getSocialLayerData(projects);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <ProjectDirectory
          projects={projects}
          socialSignals={socialData.projects}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
