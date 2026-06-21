import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PublicProjectSubmissionForm } from "@/components/submit/public-project-submission-form";

export const metadata: Metadata = {
  description: "Submit an Arc project for review and listing on ArcRadar.",
  title: "Submit Project",
};

export default function SubmitProjectPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PublicProjectSubmissionForm />
      </main>
      <SiteFooter />
    </div>
  );
}
