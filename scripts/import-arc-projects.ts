import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parse } from "csv-parse/sync";
import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { slugifyProjectName } from "@/lib/slug";
import { projects } from "@/server/db/schema";
import { loadLocalEnv } from "@/server/env/load-local-env";
import type { Project, ProjectCategory, ProjectLink } from "@/types/project";

loadLocalEnv();

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const csvPath = resolve(
  process.cwd(),
  process.argv[2] ?? "src/data/imports/arc-projects.csv",
);
const metadataPath = resolve(
  process.cwd(),
  process.argv[3] ?? "src/data/imports/project-metadata.json",
);

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required.");
}

const records = parse(readFileSync(csvPath, "utf8"), {
  bom: true,
  columns: true,
  relax_column_count: true,
  skip_empty_lines: true,
  trim: true,
}) as CsvProjectRow[];
const uniqueRecords = deduplicateByWebsite(records);
const metadataByWebsite = new Map(
  Object.entries(
    JSON.parse(readFileSync(metadataPath, "utf8")) as Record<
      string,
      CuratedProjectMetadata
    >,
  ).map(([website, metadata]) => [normalizeWebsite(website), metadata]),
);
const missingMetadata = uniqueRecords
  .map((record) => normalizeWebsite(record["Project Link"]))
  .filter((website) => !metadataByWebsite.has(website));

if (missingMetadata.length > 0) {
  throw new Error(
    `Curated metadata is missing for:\n${missingMetadata.join("\n")}`,
  );
}

const client = postgres(databaseUrl, { max: 1 });
const database = drizzle(client);

try {
  const existingProjects = await database
    .select({
      rank: projects.rank,
      slug: projects.slug,
      websiteUrl: projects.websiteUrl,
    })
    .from(projects)
    .orderBy(asc(projects.rank));
  const existingByWebsite = new Map(
    existingProjects
      .filter((project) => project.websiteUrl)
      .map((project) => [normalizeWebsite(project.websiteUrl!), project]),
  );
  const usedSlugs = new Set(existingProjects.map((project) => project.slug));
  const importedSlugs = new Set<string>();
  const values = uniqueRecords.map((record, index) => {
    const websiteUrl = normalizeWebsite(record["Project Link"]);
    const existing = existingByWebsite.get(websiteUrl);
    const name = normalizeProjectName(record["Project Name"], websiteUrl);
    const metadata = metadataByWebsite.get(websiteUrl)!;
    const slug =
      existing?.slug ??
      createUniqueSlug(name, websiteUrl, usedSlugs, importedSlugs);

    importedSlugs.add(slug);
    return mapRecordToProjectRow(record, {
      metadata,
      name,
      rank: existing?.rank ?? 100 + index,
      slug,
      websiteUrl,
    });
  });

  for (const value of values) {
    await database
      .insert(projects)
      .values(value)
      .onConflictDoUpdate({
        target: projects.slug,
        set: {
          accent: value.accent,
          activity: value.activity,
          builderName: value.builderName,
          category: value.category,
          description: value.description,
          lastSignal: value.lastSignal,
          name: value.name,
          profile: value.profile,
          rank: value.rank,
          socialLinks: value.socialLinks,
          tagline: value.tagline,
          tags: value.tags,
          updatedAt: new Date(),
          websiteUrl: value.websiteUrl,
        },
      });
  }

  const categoryCounts = values.reduce<Record<string, number>>(
    (counts, value) => {
      counts[value.category] = (counts[value.category] ?? 0) + 1;
      return counts;
    },
    {},
  );

  console.log(
    JSON.stringify(
      {
        categories: categoryCounts,
        csvRows: records.length,
        duplicateWebsiteRowsSkipped: records.length - uniqueRecords.length,
        importedProjects: values.length,
        metadata: metadataPath,
        source: csvPath,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}

type CsvProjectRow = {
  Category?: string;
  Notes?: string;
  "Creator Twitter"?: string;
  "Project Link": string;
  "Project Name": string;
  "Project Twitter"?: string;
};

type CuratedProjectMetadata = {
  category: ProjectCategory;
  tags: string[];
};

function mapRecordToProjectRow(
  record: CsvProjectRow,
  identity: {
    metadata: CuratedProjectMetadata;
    name: string;
    rank: number;
    slug: string;
    websiteUrl: string;
  },
) {
  const { category, tags } = identity.metadata;
  const projectXUrl = normalizeOptionalUrl(record["Project Twitter"]);
  const builderXUrl = normalizeOptionalUrl(record["Creator Twitter"]);
  const builderName = getBuilderName(builderXUrl);
  const socialLinks: ProjectLink[] = [
    { href: identity.websiteUrl, label: "Website" },
    ...(projectXUrl
      ? [{ href: projectXUrl, label: "Project X" } as const]
      : []),
    ...(builderXUrl
      ? [{ href: builderXUrl, label: "Builder X" } as const]
      : []),
  ];

  return {
    accent: getAccent(category),
    activity: [
      {
        detail: "Added from the supplied Arc ecosystem project directory.",
        label: "Directory import",
        timestamp: "2026-06-13",
      },
    ],
    builderName,
    category,
    description: `${identity.name} appears in the supplied Arc ecosystem directory under ${category}. Product claims from its official website have not been independently verified by ArcRadar.`,
    featured: false,
    lastSignal: "Imported from the Arc ecosystem project directory",
    launches: 0,
    logoUrl: null,
    name: identity.name,
    profile: {
      problem: "The source list does not include a verified problem statement.",
      solution: "Review the official project website for its current product scope.",
      whyArc: "The project was included in the supplied Arc ecosystem directory.",
    },
    projectWallet: null,
    rank: identity.rank,
    slug: identity.slug,
    socialLinks,
    tagline: `${identity.name} is listed in the Arc ecosystem ${category} directory.`,
    tags,
    totalTipsUsdcMicro: 0n,
    websiteUrl: identity.websiteUrl,
    weeklyTipsUsdcMicro: 0n,
  } satisfies typeof projects.$inferInsert;
}

function deduplicateByWebsite(records: CsvProjectRow[]) {
  const seen = new Set<string>();

  return records.filter((record) => {
    const website = normalizeWebsite(record["Project Link"]);

    if (seen.has(website)) {
      return false;
    }

    seen.add(website);
    return true;
  });
}

function createUniqueSlug(
  name: string,
  websiteUrl: string,
  existingSlugs: Set<string>,
  importedSlugs: Set<string>,
) {
  const base = slugifyProjectName(name);

  if (!existingSlugs.has(base) && !importedSlugs.has(base)) {
    return base;
  }

  const host = new URL(websiteUrl).hostname.replace(/^www\./, "").split(".")[0];
  let candidate = slugifyProjectName(`${base}-${host}`);
  let suffix = 2;

  while (existingSlugs.has(candidate) || importedSlugs.has(candidate)) {
    candidate = slugifyProjectName(`${base}-${host}-${suffix}`);
    suffix += 1;
  }

  return candidate;
}

function normalizeProjectName(rawName: string, websiteUrl: string) {
  const name = rawName.replace(/\s+/g, " ").trim();

  if (name && !/^https?:\/\//i.test(name)) {
    return name.slice(0, 120);
  }

  const host = new URL(websiteUrl).hostname.replace(/^www\./, "").split(".")[0];
  return host
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 120);
}

function normalizeWebsite(rawUrl: string) {
  const value = rawUrl.trim();
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);

  url.hash = "";
  return url.toString();
}

function normalizeOptionalUrl(rawUrl: string | undefined) {
  if (!rawUrl?.trim()) {
    return null;
  }

  try {
    return normalizeWebsite(rawUrl);
  } catch {
    return null;
  }
}

function getBuilderName(builderXUrl: string | null) {
  if (!builderXUrl) {
    return "Builder not listed";
  }

  const handle = new URL(builderXUrl).pathname.split("/").filter(Boolean)[0];
  return handle ? `@${handle}` : "Builder not listed";
}

function getAccent(category: ProjectCategory): Project["accent"] {
  const accents: Record<ProjectCategory, Project["accent"]> = {
    "AI Agents": "mint",
    Blockchain: "blueprint",
    Dashboards: "cyan",
    DeFi: "amber",
    DEX: "amber",
    "Developer Tools": "mint",
    Faucets: "cyan",
    Games: "coral",
    Infrastructure: "coral",
    NFTs: "coral",
    Other: "blueprint",
    Payments: "cyan",
    Security: "mint",
    Wallets: "blueprint",
  };

  return accents[category];
}
