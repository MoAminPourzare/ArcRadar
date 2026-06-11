"use server";

import { revalidatePath } from "next/cache";

import {
  projectSubmissionSchema,
  type ProjectSubmissionInput,
} from "@/lib/project-submission";
import { slugifyProjectName } from "@/lib/slug";
import { db } from "@/server/db/client";
import { projectSubmissions } from "@/server/db/schema";
import {
  checkRateLimit,
  formatRateLimitMessage,
} from "@/server/security/rate-limit";

export type SubmissionActionResult =
  | {
      id: string;
      status: "success";
    }
  | {
      message: string;
      status: "error";
    };

export async function createProjectSubmission(
  input: ProjectSubmissionInput,
): Promise<SubmissionActionResult> {
  const rateLimit = checkRateLimit({
    key: "admin:create-project-submission",
    limit: 20,
    windowMs: 15 * 60 * 1_000,
  });

  if (!rateLimit.ok) {
    return {
      message: formatRateLimitMessage(rateLimit),
      status: "error",
    };
  }

  const parsed = projectSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      message: "Submission data failed validation.",
      status: "error",
    };
  }

  if (!db) {
    return {
      message: "Database is not configured.",
      status: "error",
    };
  }

  const [submission] = await db
    .insert(projectSubmissions)
    .values({
      builderName: parsed.data.builderName,
      builderXUrl: parsed.data.builderXUrl || null,
      category: parsed.data.category,
      contact: parsed.data.contact || null,
      description: parsed.data.description,
      discordUrl: parsed.data.discordUrl || null,
      githubUrl: parsed.data.githubUrl || null,
      name: parsed.data.name,
      projectWallet: parsed.data.projectWallet || null,
      slug: slugifyProjectName(parsed.data.slug || parsed.data.name),
      tagline: parsed.data.tagline,
      websiteUrl: parsed.data.websiteUrl || null,
      projectXUrl: parsed.data.projectXUrl || null,
    })
    .returning({
      id: projectSubmissions.id,
    });

  revalidatePath("/admin/submissions");

  return {
    id: submission.id,
    status: "success",
  };
}
