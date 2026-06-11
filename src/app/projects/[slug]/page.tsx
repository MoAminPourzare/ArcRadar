import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectProfilePage } from "@/components/projects/project-profile-page";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { siteConfig } from "@/config/site";
import { projects as seedProjects } from "@/data/projects";
import {
  getProjects,
  getProjectTipData,
  getRelatedProjectsFromList,
} from "@/server/projects/repository";
import { getSocialLayerData } from "@/server/social/repository";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = seedProjects.find((candidate) => candidate.slug === slug);

  if (!project) {
    return {
      title: "Project not found",
    };
  }

  return {
    title: project.name,
    description: project.tagline,
    openGraph: {
      title: `${project.name} | ${siteConfig.name}`,
      description: project.description,
      url: `${siteConfig.url}/projects/${project.slug}`,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const allProjects = await getProjects();
  const project = allProjects.find((candidate) => candidate.slug === slug);

  if (!project) {
    notFound();
  }

  const relatedProjects = getRelatedProjectsFromList(project, allProjects);
  const tipData = await getProjectTipData(project);
  const socialData = await getSocialLayerData(allProjects);
  const socialSignal = socialData.projects.find(
    (signal) => signal.project.slug === project.slug,
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <ProjectProfilePage
        project={project}
        relatedProjects={relatedProjects}
        socialSignal={socialSignal}
        tipData={tipData}
      />
      <SiteFooter />
    </div>
  );
}
