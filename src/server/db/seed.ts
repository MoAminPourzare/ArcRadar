import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";

import { projects as seedProjects } from "@/data/projects";
import { projectTips } from "@/data/tips";
import { projects, tips } from "@/server/db/schema";
import type { Project } from "@/types/project";

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required to seed.");
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

main().catch(async (error) => {
  await client.end();
  console.error(error);
  process.exit(1);
});

async function main() {
  await seedProjectsIntoDatabase();
  await seedTipsIntoDatabase();
  await client.end();
}

async function seedProjectsIntoDatabase() {
  for (const project of seedProjects) {
    const values = mapProjectToRow(project);

    await db
      .insert(projects)
      .values(values)
      .onConflictDoUpdate({
        target: projects.slug,
        set: {
          accent: values.accent,
          activity: values.activity,
          builderName: values.builderName,
          category: values.category,
          description: values.description,
          featured: values.featured,
          lastSignal: values.lastSignal,
          launches: values.launches,
          logoUrl: values.logoUrl,
          name: values.name,
          profile: values.profile,
          projectWallet: values.projectWallet,
          rank: values.rank,
          signalScore: values.signalScore,
          socialLinks: values.socialLinks,
          stage: values.stage,
          status: values.status,
          supporters: values.supporters,
          tagline: values.tagline,
          tags: values.tags,
          totalTipsUsdcMicro: values.totalTipsUsdcMicro,
          updatedAt: new Date(),
          websiteUrl: values.websiteUrl,
          weeklyTipsUsdcMicro: values.weeklyTipsUsdcMicro,
        },
      });
  }

  console.log(`Seeded ${seedProjects.length} ArcRadar projects.`);
}

async function seedTipsIntoDatabase() {
  for (const project of seedProjects) {
    const [projectRow] = await db
      .select({
        id: projects.id,
      })
      .from(projects)
      .where(eq(projects.slug, project.slug))
      .limit(1);

    if (!projectRow) {
      continue;
    }

    const projectTipRows = projectTips.filter(
      (tip) => tip.projectSlug === project.slug,
    );

    for (const tip of projectTipRows) {
      await db
        .insert(tips)
        .values({
          amountUsdcMicro: toUsdcMicro(tip.amountUsdc),
          createdAt: new Date(tip.timestamp),
          message: tip.message,
          projectId: projectRow.id,
          recipientAddress: project.walletAddress,
          tipperAddress: tip.tipperAddress,
          transactionHash: tip.transactionHash,
        })
        .onConflictDoNothing({
          target: tips.transactionHash,
        });
    }
  }

  console.log(`Seeded ${projectTips.length} ArcRadar tips.`);
}

function mapProjectToRow(project: Project) {
  const websiteUrl =
    project.links.find((link) => link.label === "Website")?.href ??
    project.links[0]?.href ??
    null;

  return {
    accent: project.accent,
    activity: project.activity,
    builderName: project.builder,
    category: project.category,
    description: project.description,
    featured: Boolean(project.featured),
    lastSignal: project.lastSignal,
    launches: project.metrics.launches,
    logoUrl: null,
    name: project.name,
    profile: project.profile,
    projectWallet: project.walletAddress,
    rank: project.metrics.rank,
    signalScore: project.metrics.signalScore,
    slug: project.slug,
    socialLinks: project.links,
    stage: project.stage,
    status: project.status,
    supporters: project.metrics.supporters,
    tagline: project.tagline,
    tags: project.tags,
    totalTipsUsdcMicro: toUsdcMicro(project.metrics.tipsUsdc),
    websiteUrl,
    weeklyTipsUsdcMicro: toUsdcMicro(project.metrics.weeklyTipsUsdc),
  };
}

function toUsdcMicro(value: number) {
  return BigInt(Math.round(value * 1_000_000));
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
