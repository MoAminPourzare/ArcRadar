import type { Metadata } from "next";
import { AlertTriangle, ArrowUpRight, Inbox, ShieldCheck } from "lucide-react";
import { desc } from "drizzle-orm";
import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { db } from "@/server/db/client";
import { projectSubmissions } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submission Queue",
  description: "Review ArcRadar project submissions.",
};

export default async function AdminSubmissionsPage() {
  const submissions = db
    ? await db
        .select()
        .from(projectSubmissions)
        .orderBy(desc(projectSubmissions.submittedAt))
    : [];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border border-amber/40 bg-amber/15 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 size-5 text-ink" />
            <div>
              <p className="font-black text-ink">Admin preview</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
                This queue is intentionally simple for phase 3. Add auth before
                exposing it on a public deployment.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-blueprint">
              Admin queue
            </p>
            <h1 className="mt-2 text-4xl font-black text-ink">
              Project submissions
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
              Review builder-submitted project packets before they become
              public ArcRadar profiles.
            </p>
          </div>
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-black text-ink/60 shadow-sm">
            <Inbox aria-hidden className="size-4 text-blueprint" />
            {submissions.length} submissions
          </div>
          <Link className="btn-primary min-h-11" href="/admin/projects/new">
            New candidate
          </Link>
        </div>

        {db ? (
          <div className="grid gap-4">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <article
                  className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm"
                  key={submission.id}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-cyan/15 px-2.5 py-1 text-xs font-black uppercase text-blueprint">
                          {submission.category}
                        </span>
                        <span className="rounded-md bg-ink/5 px-2.5 py-1 text-xs font-black uppercase text-ink/55">
                          {submission.stage}
                        </span>
                        <span className="rounded-md bg-mint/20 px-2.5 py-1 text-xs font-black uppercase text-forest">
                          {submission.status}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-ink">
                        {submission.name}
                      </h2>
                      <p className="mt-2 text-base font-black text-ink/75">
                        {submission.tagline}
                      </p>
                      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-ink/55">
                        {submission.description}
                      </p>
                    </div>

                    <div className="grid min-w-72 gap-2 rounded-lg border border-ink/10 bg-paper p-3 text-sm">
                      <InfoRow label="Builder" value={submission.builderName} />
                      <InfoRow label="Contact" value={submission.contact} />
                      <InfoRow
                        label="Wallet"
                        value={submission.projectWallet}
                      />
                      <InfoRow
                        label="Submitted"
                        value={submission.submittedAt.toISOString().slice(0, 10)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                    <SubmissionLink label="Website" href={submission.websiteUrl} />
                    <SubmissionLink label="X" href={submission.xUrl} />
                    <SubmissionLink label="Discord" href={submission.discordUrl} />
                    <SubmissionLink label="GitHub" href={submission.githubUrl} />
                  </div>
                </article>
              ))
            ) : (
              <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-ink/20 bg-white p-8 text-center">
                <div>
                  <ShieldCheck
                    aria-hidden
                    className="mx-auto mb-4 size-8 text-forest"
                  />
                  <p className="text-xl font-black text-ink">Queue is empty</p>
                  <p className="mt-2 text-sm font-semibold text-ink/55">
                    New validated submissions will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-coral/30 bg-white p-5 text-sm font-bold text-coral shadow-sm">
            Database is not configured. Add DATABASE_URL to view submissions.
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: null | string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-black uppercase text-ink/40">{label}</span>
      <span className="break-all text-right font-mono text-xs font-black text-ink">
        {value || "-"}
      </span>
    </div>
  );
}

function SubmissionLink({
  href,
  label,
}: {
  href: null | string;
  label: string;
}) {
  if (!href) {
    return null;
  }

  return (
    <a
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-paper px-3 text-xs font-black uppercase text-ink transition hover:border-ink/30"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <ArrowUpRight aria-hidden className="size-3.5" />
    </a>
  );
}
