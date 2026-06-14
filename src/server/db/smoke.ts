import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { desc, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { projectSubmissionSchema } from "@/lib/project-submission";
import { projectSubmissions } from "@/server/db/schema";

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required.");
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

main().catch(async (error) => {
  await client.end();
  console.error(error);
  process.exit(1);
});

async function main() {
  const suffix = Date.now().toString().slice(-5);
  const input = projectSubmissionSchema.parse({
    builderName: "ArcRadar QA",
    builderXUrl: "",
    category: "AI Agents",
    contact: "",
    description:
      "This is a database-backed ArcRadar smoke submission used to confirm that the Neon project submission queue is working end to end.",
    githubUrl: "",
    name: `ArcRadar DB Smoke ${suffix}`,
    projectWallet: "0x00000000000000000000000000000000000000bb",
    tagline: "Database-backed submission verification for ArcRadar.",
    websiteUrl: "https://example.com",
    projectXUrl: "",
  });

  const [inserted] = await db
    .insert(projectSubmissions)
    .values({
      builderName: input.builderName,
      builderXUrl: input.builderXUrl || null,
      category: input.category,
      contact: input.contact || null,
      description: input.description,
      githubUrl: input.githubUrl || null,
      name: input.name,
      projectWallet: input.projectWallet || null,
      tagline: input.tagline,
      websiteUrl: input.websiteUrl || null,
      projectXUrl: input.projectXUrl || null,
    })
    .returning({
      id: projectSubmissions.id,
      name: projectSubmissions.name,
    });

  const [fetched] = await db
    .select({
      id: projectSubmissions.id,
      name: projectSubmissions.name,
      status: projectSubmissions.status,
    })
    .from(projectSubmissions)
    .where(eq(projectSubmissions.id, inserted.id))
    .orderBy(desc(projectSubmissions.submittedAt))
    .limit(1);

  await db
    .delete(projectSubmissions)
    .where(like(projectSubmissions.name, "ArcRadar DB Smoke %"));

  await client.end();

  console.log(
    JSON.stringify({
      cleanedSmokeRows: true,
      fetched,
      inserted,
      ok: Boolean(fetched?.id === inserted.id),
    }),
  );
}

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const contents = readFileSync(envPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^"|"$/g, "");
  }
}
