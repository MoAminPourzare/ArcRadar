import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { publicProjectSubmissionSchema } from "@/lib/project-submission";
import { slugifyProjectName } from "@/lib/slug";
import { getDb } from "@/server/db/client";
import {
  projectLogoAssets,
  projectSubmissions,
  projects,
} from "@/server/db/schema";
import {
  getSafeImageExtension,
  hasValidImageSignature,
  validateImageUploadCandidate,
} from "@/server/security/image-upload";
import { checkRateLimit } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return json({ error: "Cross-origin submissions are not accepted." }, 403);
  }

  const rateLimit = checkRateLimit({
    key: `public-project-submit:${getClientKey(request)}`,
    limit: 3,
    windowMs: 60 * 60 * 1_000,
  });

  if (!rateLimit.ok) {
    return json(
      { error: "Too many submissions. Try again later." },
      429,
      { "Retry-After": rateLimit.retryAfterSeconds.toString() },
    );
  }

  const db = getDb();

  if (!db) {
    return json({ error: "Project submission is temporarily unavailable." }, 503);
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return json({ error: "The submitted form could not be read." }, 400);
  }

  if (getFormString(formData, "company")) {
    return json({ ok: true, status: "pending" }, 202);
  }

  const parsed = publicProjectSubmissionSchema.safeParse({
    builderName: getFormString(formData, "builderName"),
    builderXUrl: getFormString(formData, "builderXUrl"),
    category: getFormString(formData, "category"),
    contact: getFormString(formData, "contact"),
    description: getFormString(formData, "description"),
    githubUrl: getFormString(formData, "githubUrl"),
    name: getFormString(formData, "name"),
    projectWallet: getFormString(formData, "projectWallet"),
    projectXUrl: getFormString(formData, "projectXUrl"),
    slug: getFormString(formData, "slug"),
    tagline: getFormString(formData, "tagline"),
    websiteUrl: getFormString(formData, "websiteUrl"),
  });

  if (!parsed.success) {
    return json(
      {
        error: parsed.error.issues[0]?.message ?? "Submission data is invalid.",
      },
      400,
    );
  }

  const logo = formData.get("logo");

  if (!(logo instanceof File) || logo.size === 0) {
    return json({ error: "A project logo is required." }, 400);
  }

  const logoCandidate = validateImageUploadCandidate(logo);

  if (!logoCandidate.ok) {
    return json({ error: logoCandidate.reason }, 400);
  }

  const bytes = await logo.arrayBuffer();

  if (!hasValidImageSignature(new Uint8Array(bytes), logo.type)) {
    return json({ error: "The uploaded file is not a valid image." }, 400);
  }

  const extension = getSafeImageExtension(logo.type);

  if (!extension) {
    return json({ error: "The uploaded image format is not supported." }, 400);
  }

  const slug = slugifyProjectName(parsed.data.slug || parsed.data.name);
  const [publishedProject, queuedSubmission] = await Promise.all([
    db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1),
    db
      .select({ id: projectSubmissions.id })
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.slug, slug),
          ne(projectSubmissions.status, "rejected"),
        ),
      )
      .limit(1),
  ]);

  if (publishedProject.length > 0 || queuedSubmission.length > 0) {
    return json(
      { error: "This project is already published or waiting for review." },
      409,
    );
  }

  const logoKey = `${crypto.randomUUID()}.${extension}`;
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const logoUrl = new URL(
    `/api/project-logos/${logoKey}`,
    publicBaseUrl,
  ).toString();

  try {
    const submission = await db.transaction(async (transaction) => {
      await transaction.insert(projectLogoAssets).values({
        bytes: Buffer.from(bytes),
        contentType: logo.type,
        key: logoKey,
        size: logo.size,
      });

      const [createdSubmission] = await transaction
        .insert(projectSubmissions)
        .values({
          builderName: parsed.data.builderName,
          builderXUrl: parsed.data.builderXUrl || null,
          category: parsed.data.category,
          contact: parsed.data.contact,
          description: parsed.data.description,
          githubUrl: parsed.data.githubUrl || null,
          logoUrl,
          name: parsed.data.name,
          projectWallet: parsed.data.projectWallet || null,
          projectXUrl: parsed.data.projectXUrl || null,
          slug,
          tagline: parsed.data.tagline,
          websiteUrl: parsed.data.websiteUrl || null,
        })
        .returning({ id: projectSubmissions.id });

      return createdSubmission;
    });

    return json(
      {
        id: submission.id,
        ok: true,
        status: "pending",
      },
      201,
    );
  } catch (error) {
    console.error("Public project submission failed", { error, slug });

    return json({ error: "The project could not be submitted yet." }, 503);
  }
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    const requestHost =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");

    return (
      origin === request.nextUrl.origin ||
      Boolean(requestHost && new URL(origin).host === requestHost)
    );
  } catch {
    return false;
  }
}

function json(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string> = {},
) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
    status,
  });
}
