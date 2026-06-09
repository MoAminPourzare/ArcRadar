import type { Metadata } from "next";
import Link from "next/link";

import { SubmitProjectForm } from "@/components/submit/submit-project-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "New Project Candidate",
  description: "Create an internal ArcRadar project candidate.",
};

export default function NewProjectCandidatePage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="text-sm font-black text-ink/55 transition hover:text-ink"
            href="/admin/submissions"
          >
            Back to review queue
          </Link>
          <span className="rounded-lg border border-amber/40 bg-amber/15 px-3 py-2 text-xs font-black uppercase text-ink">
            Internal only
          </span>
        </div>
        <SubmitProjectForm />
      </main>
      <SiteFooter />
    </div>
  );
}
