import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectProfilePage } from "@/components/projects/project-profile-page";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { siteConfig } from "@/config/site";
import {
  getProjectBySlug,
  getProjectTipData,
  getRelatedProjects,
} from "@/server/projects/repository";

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
  const project = await getProjectBySlug(slug);

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
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const relatedProjects = await getRelatedProjects(project);
  const tipData = await getProjectTipData(project);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <ProjectProfilePage
        project={project}
        relatedProjects={relatedProjects}
        tipData={tipData}
      />
      <SiteFooter />
    </div>
  );
}
