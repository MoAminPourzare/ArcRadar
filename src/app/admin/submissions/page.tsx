import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Inbox,
  Rocket,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { desc } from "drizzle-orm";
import Link from "next/link";

import {
  approveSubmission,
  publishSubmission,
  rejectSubmission,
  reopenSubmission,
} from "@/app/admin/submissions/actions";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { slugifyProjectName } from "@/lib/slug";
import { db } from "@/server/db/client";
import { projectSubmissions } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submission Queue",
  description: "Review ArcRadar project submissions.",
};

type Submission = typeof projectSubmissions.$inferSelect;

export default async function AdminSubmissionsPage() {
  const submissions = db
    ? await db
        .select()
        .from(projectSubmissions)
        .orderBy(desc(projectSubmissions.submittedAt))
    : [];
  const stats = getQueueStats(submissions);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border border-amber/40 bg-amber/15 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 size-5 text-ink" />
            <div>
              <p className="font-black text-ink">Internal-only moderation</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
                Builders cannot submit projects directly. ArcRadar creates
                internal candidates, reviews them here, and only publishes
                approved entries to the public directory.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-blueprint">
              Admin queue
            </p>
            <h1 className="mt-2 text-4xl font-black text-ink">
              Curation moderation
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
              Move candidates from pending review to approved, rejected, or
              published project profiles without opening a public submit flow.
            </p>
          </div>
          <Link className="btn-primary min-h-11" href="/admin/projects/new">
            New candidate
          </Link>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <QueueStat icon={Inbox} label="Total" value={submissions.length} />
          <QueueStat icon={CircleDot} label="Pending" value={stats.pending} />
          <QueueStat icon={BadgeCheck} label="Approved" value={stats.approved} />
          <QueueStat icon={XCircle} label="Rejected" value={stats.rejected} />
          <QueueStat icon={Rocket} label="Published" value={stats.published} />
        </div>

        {db ? (
          <div className="grid gap-4">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
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
                    New validated internal candidates will appear here.
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

function SubmissionCard({ submission }: { submission: Submission }) {
  const slug = submission.slug || slugifyProjectName(submission.name);
  const isPublished = Boolean(submission.publishedProjectId);
  const statusLabel = isPublished ? "published" : submission.status;
  const checks = [
    {
      done: Boolean(submission.projectWallet),
      label: "Arc tip wallet",
    },
    {
      done: Boolean(
        submission.websiteUrl ||
          submission.projectXUrl ||
          submission.builderXUrl ||
          submission.discordUrl ||
          submission.githubUrl,
      ),
      label: "Public proof link",
    },
    {
      done: submission.status === "approved",
      label: "Admin approved",
    },
    {
      done: !isPublished,
      label: "Not published yet",
    },
  ];

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-md bg-cyan/15 px-2.5 py-1 text-xs font-black uppercase text-blueprint">
              {submission.category}
            </span>
            <span className={getStatusClass(statusLabel)}>{statusLabel}</span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-black text-ink">
                {submission.name}
              </h2>
              <p className="mt-2 text-base font-black text-ink/75">
                {submission.tagline}
              </p>
            </div>
            {isPublished ? (
              <Link className="btn-secondary shrink-0" href={`/projects/${slug}`}>
                Open profile
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            ) : null}
          </div>

          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-ink/55">
            {submission.description}
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="grid gap-2 rounded-lg border border-ink/10 bg-paper p-3 text-sm">
              <InfoRow label="Builder" value={submission.builderName} />
              <InfoRow label="Contact" value={submission.contact} />
              <InfoRow label="Slug" value={slug} />
              <InfoRow label="Wallet" value={submission.projectWallet} />
            </div>
            <div className="grid gap-2 rounded-lg border border-ink/10 bg-paper p-3 text-sm">
              <InfoRow
                label="Submitted"
                value={submission.submittedAt.toISOString().slice(0, 10)}
              />
              <InfoRow
                label="Reviewed"
                value={submission.reviewedAt?.toISOString().slice(0, 10) ?? null}
              />
              <InfoRow
                label="Published"
                value={submission.publishedAt?.toISOString().slice(0, 10) ?? null}
              />
              <InfoRow
                label="Project ID"
                value={submission.publishedProjectId}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
            <SubmissionLink label="Website" href={submission.websiteUrl} />
            <SubmissionLink label="Project X" href={submission.projectXUrl} />
            <SubmissionLink label="Builder X" href={submission.builderXUrl} />
            <SubmissionLink label="Discord" href={submission.discordUrl} />
            <SubmissionLink label="GitHub" href={submission.githubUrl} />
          </div>

          {submission.reviewNotes ? (
            <div className="mt-5 rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-xs font-black uppercase text-ink/40">
                Review notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-ink/65">
                {submission.reviewNotes}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-ink/10 bg-paper p-4">
            <p className="text-xs font-black uppercase text-ink/40">
              Publishing readiness
            </p>
            <div className="mt-4 grid gap-2">
              {checks.map((check) => (
                <div
                  className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white p-3"
                  key={check.label}
                >
                  <CheckCircle2
                    aria-hidden
                    className={`size-5 ${
                      check.done ? "text-forest" : "text-ink/25"
                    }`}
                  />
                  <span className="text-sm font-bold text-ink/65">
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <ModerationForms isPublished={isPublished} submission={submission} />
        </aside>
      </div>
    </article>
  );
}

function ModerationForms({
  isPublished,
  submission,
}: {
  isPublished: boolean;
  submission: Submission;
}) {
  if (isPublished) {
    return (
      <section className="rounded-lg border border-forest/25 bg-mint/20 p-4">
        <p className="text-sm font-black text-forest">
          Published profiles are locked from queue status changes.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-3">
      {submission.status !== "approved" ? (
        <form
          action={approveSubmission}
          className="rounded-lg border border-forest/25 bg-mint/15 p-4"
        >
          <input name="id" type="hidden" value={submission.id} />
          <ReviewNotesField label="Approval notes" />
          <button className="btn-secondary mt-3 w-full" type="submit">
            Approve candidate
            <BadgeCheck aria-hidden className="size-4" />
          </button>
        </form>
      ) : null}

      {submission.status === "approved" ? (
        <form
          action={publishSubmission}
          className="rounded-lg border border-blueprint/20 bg-blueprint/10 p-4"
        >
          <input name="id" type="hidden" value={submission.id} />
          <ReviewNotesField label="Publish notes" />
          <button className="btn-primary mt-3 w-full" type="submit">
            Publish to directory
            <Rocket aria-hidden className="size-4" />
          </button>
        </form>
      ) : null}

      {submission.status !== "rejected" ? (
        <form
          action={rejectSubmission}
          className="rounded-lg border border-coral/25 bg-coral/10 p-4"
        >
          <input name="id" type="hidden" value={submission.id} />
          <ReviewNotesField label="Rejection notes" />
          <button className="btn-warning mt-3 w-full" type="submit">
            Reject candidate
            <XCircle aria-hidden className="size-4" />
          </button>
        </form>
      ) : null}

      {submission.status !== "pending" ? (
        <form action={reopenSubmission}>
          <input name="id" type="hidden" value={submission.id} />
          <button className="btn-ghost w-full" type="submit">
            Return to pending
            <RotateCcw aria-hidden className="size-4" />
          </button>
        </form>
      ) : null}
    </section>
  );
}

function ReviewNotesField({ label }: { label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase text-ink/45">{label}</span>
      <textarea
        className="min-h-24 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-semibold leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-blueprint"
        name="reviewNotes"
        placeholder="Optional internal note"
      />
    </label>
  );
}

function QueueStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Icon aria-hidden className="size-5 text-blueprint" />
        <span className="text-xs font-black uppercase text-ink/40">
          {label}
        </span>
      </div>
      <p className="font-mono text-3xl font-black text-ink">{value}</p>
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
      <ExternalLink aria-hidden className="size-3.5" />
    </a>
  );
}

function getQueueStats(submissions: Submission[]) {
  return submissions.reduce(
    (stats, submission) => {
      stats[submission.status] += 1;

      if (submission.publishedProjectId) {
        stats.published += 1;
      }

      return stats;
    },
    {
      approved: 0,
      pending: 0,
      published: 0,
      rejected: 0,
    },
  );
}

function getStatusClass(status: string) {
  const base =
    "rounded-md px-2.5 py-1 text-xs font-black uppercase transition";

  if (status === "published") {
    return `${base} bg-blueprint text-paper`;
  }

  if (status === "approved") {
    return `${base} bg-mint/20 text-forest`;
  }

  if (status === "rejected") {
    return `${base} bg-coral/15 text-coral`;
  }

  return `${base} bg-amber/20 text-ink`;
}
