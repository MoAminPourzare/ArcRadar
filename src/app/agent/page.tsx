import type { Metadata } from "next";

import { AgentWorkspace } from "@/components/agents/agent-workspace";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { parseProjectId } from "@/lib/project-id";
import { getLatestProjectAgentReports } from "@/server/agents/repository";
import { getProjects } from "@/server/projects/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agent",
  description:
    "Run ArcRadar agents for project audits, builder checks, and future Arc-native automation.",
};

type AgentPageProps = {
  searchParams?: Promise<{
    project?: string;
  }>;
};

export default async function AgentPage({ searchParams }: AgentPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialProjectSlug = resolvedSearchParams?.project
    ? parseProjectId(resolvedSearchParams.project)
    : undefined;
  const [projects, latestReportsByProjectId] = await Promise.all([
    getProjects(),
    getLatestProjectAgentReports(),
  ]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <AgentWorkspace
          initialProjectSlug={initialProjectSlug ?? undefined}
          latestReportsByProjectId={latestReportsByProjectId}
          projects={projects}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
