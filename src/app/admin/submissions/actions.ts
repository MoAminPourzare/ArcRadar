"use server";

import { revalidatePath } from "next/cache";

import { slugifyProjectName } from "@/lib/slug";
import { db } from "@/server/db/client";
import { projectSubmissions, projects } from "@/server/db/schema";
import { checkRateLimit } from "@/server/security/rate-limit";
import type { ProjectLink } from "@/types/project";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const moderationActionSchema = z.object({
  id: z.string().uuid(),
  reviewNotes: z.string().trim().max(2_000).optional(),
});

const accentByCategory = {
  "AI Agents": "mint",
  DeFi: "amber",
  "Developer Tools": "mint",
  Infrastructure: "coral",
  Payments: "cyan",
  Wallets: "blueprint",
} as const;

export async function approveSubmission(formData: FormData) {
  if (!canRunModerationAction("approve")) {
    return;
  }

  const input = parseModerationForm(formData);

  if (!db || !input) {
    return;
  }

  await db
    .update(projectSubmissions)
    .set({
      ...(input.reviewNotes ? { reviewNotes: input.reviewNotes } : {}),
      reviewedAt: new Date(),
      status: "approved",
    })
    .where(eq(projectSubmissions.id, input.id));

  revalidateAdminSurfaces();
}

export async function rejectSubmission(formData: FormData) {
  if (!canRunModerationAction("reject")) {
    return;
  }

  const input = parseModerationForm(formData);

  if (!db || !input) {
    return;
  }

  await db
    .update(projectSubmissions)
    .set({
      ...(input.reviewNotes ? { reviewNotes: input.reviewNotes } : {}),
      reviewedAt: new Date(),
      status: "rejected",
    })
    .where(eq(projectSubmissions.id, input.id));

  revalidateAdminSurfaces();
}

export async function reopenSubmission(formData: FormData) {
  if (!canRunModerationAction("reopen")) {
    return;
  }

  const input = parseModerationForm(formData);

  if (!db || !input) {
    return;
  }

  const [submission] = await db
    .select({
      publishedProjectId: projectSubmissions.publishedProjectId,
    })
    .from(projectSubmissions)
    .where(eq(projectSubmissions.id, input.id))
    .limit(1);

  if (submission?.publishedProjectId) {
    await recordSystemNote(input.id, "Published projects cannot be reopened.");
    revalidateAdminSurfaces();
    return;
  }

  await db
    .update(projectSubmissions)
    .set({
      ...(input.reviewNotes ? { reviewNotes: input.reviewNotes } : {}),
      reviewedAt: null,
      status: "pending",
    })
    .where(eq(projectSubmissions.id, input.id));

  revalidateAdminSurfaces();
}

export async function publishSubmission(formData: FormData) {
  if (!canRunModerationAction("publish")) {
    return;
  }

  const input = parseModerationForm(formData);

  if (!db || !input) {
    return;
  }

  const result = await db.transaction(async (tx) => {
    const [submission] = await tx
      .select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.id, input.id))
      .limit(1);

    if (!submission) {
      return {
        publishedSlug: null,
        systemNote: "Submission was not found.",
      };
    }

    if (submission.publishedProjectId) {
      return {
        publishedSlug: null,
        systemNote: "Submission is already linked to a published project.",
      };
    }

    if (submission.status !== "approved") {
      return {
        publishedSlug: null,
        systemNote: "Submission must be approved before publishing.",
      };
    }

    if (!submission.projectWallet) {
      await tx
        .update(projectSubmissions)
        .set({
          reviewNotes: mergeReviewNotes(
            submission.reviewNotes,
            "Publish blocked: Arc tip wallet is required.",
          ),
          reviewedAt: new Date(),
        })
        .where(eq(projectSubmissions.id, input.id));

      return {
        publishedSlug: null,
        systemNote: null,
      };
    }

    const slug = slugifyProjectName(submission.slug || submission.name);
    const [existingProject] = await tx
      .select({
        id: projects.id,
        slug: projects.slug,
      })
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    if (existingProject) {
      await tx
        .update(projectSubmissions)
        .set({
          reviewNotes: mergeReviewNotes(
            submission.reviewNotes,
            `Publish blocked: /projects/${slug} already exists.`,
          ),
          slug,
        })
        .where(eq(projectSubmissions.id, input.id));

      return {
        publishedSlug: null,
        systemNote: null,
      };
    }

    const [lastRankedProject] = await tx
      .select({
        rank: projects.rank,
      })
      .from(projects)
      .orderBy(desc(projects.rank))
      .limit(1);
    const nextRank = (lastRankedProject?.rank ?? 0) + 1;
    const now = new Date();
    const projectValues = buildProjectValues({
      nextRank,
      now,
      projectWallet: submission.projectWallet,
      slug,
      submission,
    });
    const [project] = await tx
      .insert(projects)
      .values(projectValues)
      .returning({
        id: projects.id,
        slug: projects.slug,
      });

    await tx
      .update(projectSubmissions)
      .set({
        publishedAt: now,
        publishedProjectId: project.id,
        reviewNotes: input.reviewNotes || submission.reviewNotes,
        reviewedAt: now,
        slug,
        status: "approved",
      })
      .where(eq(projectSubmissions.id, input.id));

    return {
      publishedSlug: project.slug,
      systemNote: null,
    };
  });

  if (result.systemNote) {
    await recordSystemNote(input.id, result.systemNote);
  }

  revalidateAdminSurfaces();
  revalidatePath("/");

  if (result.publishedSlug) {
    revalidatePath(`/projects/${result.publishedSlug}`);
  }
}

function buildProjectValues({
  nextRank,
  now,
  projectWallet,
  slug,
  submission,
}: {
  nextRank: number;
  now: Date;
  projectWallet: string;
  slug: string;
  submission: typeof projectSubmissions.$inferSelect;
}) {
  const socialLinks = [
    submission.websiteUrl
      ? { href: submission.websiteUrl, label: "Website" }
      : null,
    submission.projectXUrl
      ? { href: submission.projectXUrl, label: "Project X" }
      : null,
    submission.builderXUrl
      ? { href: submission.builderXUrl, label: "Builder X" }
      : null,
    submission.discordUrl
      ? { href: submission.discordUrl, label: "Discord" }
      : null,
    submission.githubUrl ? { href: submission.githubUrl, label: "GitHub" } : null,
  ].filter((link): link is ProjectLink => Boolean(link));
  const activityDate = now.toISOString().slice(0, 10);
  return {
    accent: accentByCategory[submission.category],
    activity: [
      {
        detail: "Internal candidate approved and published to the ArcRadar directory.",
        label: "Published from moderation",
        timestamp: activityDate,
      },
    ],
    builderName: submission.builderName,
    category: submission.category,
    createdAt: now,
    description: submission.description,
    featured: false,
    lastSignal: "Published through ArcRadar moderation",
    launches: 0,
    logoUrl: null,
    name: submission.name,
    profile: {
      problem:
        "ArcRadar is tracking this project because it may add useful surface area to the Arc Testnet builder map.",
      solution: submission.tagline,
      whyArc:
        "The project is listed for Arc Testnet exploration and should be evaluated around USDC-native UX, finality, and builder usefulness.",
    },
    projectWallet,
    rank: nextRank,
    slug,
    socialLinks,
    tagline: submission.tagline,
    tags: [],
    totalTipsUsdcMicro: 0n,
    updatedAt: now,
    websiteUrl: submission.websiteUrl,
    weeklyTipsUsdcMicro: 0n,
  };
}

async function recordSystemNote(id: string, note: string) {
  if (!db) {
    return;
  }

  const [submission] = await db
    .select({
      reviewNotes: projectSubmissions.reviewNotes,
    })
    .from(projectSubmissions)
    .where(eq(projectSubmissions.id, id))
    .limit(1);

  await db
    .update(projectSubmissions)
    .set({
      reviewNotes: mergeReviewNotes(submission?.reviewNotes ?? null, note),
    })
    .where(eq(projectSubmissions.id, id));
}

function parseModerationForm(formData: FormData) {
  const parsed = moderationActionSchema.safeParse({
    id: formData.get("id"),
    reviewNotes: formData.get("reviewNotes"),
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

function mergeReviewNotes(existing: null | string, note: string) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const normalizedNote = `[${timestamp}] ${note}`;

  if (!existing?.trim()) {
    return normalizedNote;
  }

  if (existing.includes(note)) {
    return existing;
  }

  return `${existing.trim()}\n${normalizedNote}`;
}

function revalidateAdminSurfaces() {
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/projects/new");
}

function canRunModerationAction(action: string) {
  const rateLimit = checkRateLimit({
    key: `admin:moderation:${action}`,
    limit: 60,
    windowMs: 5 * 60 * 1_000,
  });

  return rateLimit.ok;
}
