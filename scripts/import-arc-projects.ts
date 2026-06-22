import { existsSync, readFileSync } from "node:fs";
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

const commandArguments = process.argv.slice(2);
const positionalArguments = commandArguments.filter(
  (argument) => !argument.startsWith("--"),
);
const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const csvPath = resolve(
  process.cwd(),
  positionalArguments[0] ?? "src/data/imports/arc-projects.csv",
);
const metadataPath = resolve(
  process.cwd(),
  positionalArguments[1] ?? "src/data/imports/project-metadata.json",
);
const auditPath = resolve(
  process.cwd(),
  positionalArguments[2] ?? "src/data/imports/arc-ecosystem-website-audit.json",
);
const dryRun = commandArguments.includes("--dry-run");

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
const sourceRecords = records
  .map(normalizeCsvRecord)
  .filter((record): record is SourceProjectRecord => Boolean(record));
const uniqueRecords = deduplicateByWebsite(sourceRecords);
const metadataByWebsite = loadMetadata(metadataPath);
const auditByWebsite = loadWebsiteAudit(auditPath);
const client = postgres(databaseUrl, { max: 1 });
const database = drizzle(client);

try {
  const existingProjects = await database
    .select({
      name: projects.name,
      rank: projects.rank,
      slug: projects.slug,
      websiteUrl: projects.websiteUrl,
    })
    .from(projects)
    .orderBy(asc(projects.rank));
  const existingIndexes = buildExistingIndexes(existingProjects);
  const usedSlugs = new Set(existingProjects.map((project) => project.slug));
  const importedSlugs = new Set<string>();
  const maxRank = existingProjects.reduce(
    (rank, project) => Math.max(rank, project.rank),
    0,
  );
  let nextRankOffset = 1;
  let insertedProjects = 0;
  let updatedProjects = 0;

  const values = uniqueRecords.map((record) => {
    const existing = findExistingProject(record, existingIndexes);
    const audit = getAuditForRecord(record, auditByWebsite);
    const metadata =
      findMetadata(record, metadataByWebsite) ??
      inferProjectMetadata(record, audit);
    const slug =
      existing?.slug ??
      createUniqueSlug(record, usedSlugs, importedSlugs);
    const rank = existing?.rank ?? maxRank + nextRankOffset;

    if (existing) {
      updatedProjects += 1;
    } else {
      insertedProjects += 1;
      nextRankOffset += 1;
    }

    importedSlugs.add(slug);

    return mapRecordToProjectRow(record, {
      audit,
      metadata,
      rank,
      slug,
    });
  });

  if (!dryRun) {
    await database.transaction(async (transaction) => {
      for (const value of values) {
        await transaction
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
              logoUrl: value.logoUrl,
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
        dryRun,
        duplicateWebsiteRowsSkipped: sourceRecords.length - uniqueRecords.length,
        importedProjects: values.length,
        insertedProjects,
        metadata: existsSync(metadataPath) ? metadataPath : null,
        source: csvPath,
        updatedProjects,
        websiteAudit: existsSync(auditPath) ? auditPath : null,
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
  "Logo URL"?: string;
  "Project Link"?: string;
  "Project Name"?: string;
  "Project Twitter"?: string;
  "Twitter/X Account"?: string;
  Website?: string;
};

type SourceProjectRecord = {
  builderXUrl: string | null;
  logoUrl: string | null;
  name: string;
  notes: string;
  projectXUrl: string | null;
  sourceCategory: string;
  websiteUrl: string | null;
};

type CuratedProjectMetadata = {
  category: ProjectCategory;
  tags: string[];
};

type WebsiteAudit = {
  description: string | null;
  headings: string[];
  name: string;
  ok: boolean;
  text: string;
  title: string | null;
  website: string;
};

type ExistingProjectIndex = {
  byDomain: Map<string, ExistingProject>;
  byName: Map<string, ExistingProject>;
  byWebsite: Map<string, ExistingProject>;
};

type ExistingProject = {
  name: string;
  rank: number;
  slug: string;
  websiteUrl: string | null;
};

function normalizeCsvRecord(row: CsvProjectRow): SourceProjectRecord | null {
  const rawWebsite = getField(row, "Project Link", "Website");
  const projectXUrl = normalizeXUrl(
    getField(row, "Project Twitter", "Twitter/X Account"),
  );
  let websiteUrl: string | null = null;

  try {
    websiteUrl = rawWebsite ? normalizeWebsite(rawWebsite) : null;
  } catch {
    websiteUrl = null;
  }

  const identityUrl = websiteUrl ?? projectXUrl;

  if (!identityUrl) {
    return null;
  }

  const name = normalizeProjectName(
    getField(row, "Project Name") ?? "",
    identityUrl,
  );

  return {
    builderXUrl: normalizeXUrl(getField(row, "Creator Twitter")),
    logoUrl: normalizeOptionalUrl(getField(row, "Logo URL")),
    name,
    notes: normalizeWhitespace(getField(row, "Notes") ?? ""),
    projectXUrl,
    sourceCategory: normalizeWhitespace(getField(row, "Category") ?? ""),
    websiteUrl,
  };
}

function mapRecordToProjectRow(
  record: SourceProjectRecord,
  identity: {
    audit: WebsiteAudit | undefined;
    metadata: CuratedProjectMetadata;
    rank: number;
    slug: string;
  },
) {
  const { category, tags } = identity.metadata;
  const builderName = getBuilderName(record.builderXUrl, record.projectXUrl);
  const socialLinks = getSocialLinks(record);

  return {
    accent: getAccent(category),
    activity: [
      {
        detail: "Added from the supplied Arc ecosystem project directory.",
        label: "Directory import",
        timestamp: new Date().toISOString().slice(0, 10),
      },
    ],
    builderName,
    category,
    description: buildDescription(record, category, identity.audit),
    featured: false,
    lastSignal: "Imported from the Arc ecosystem project directory",
    launches: 0,
    logoUrl: record.logoUrl,
    name: record.name,
    profile: buildProfile(record, category, identity.audit),
    projectWallet: null,
    rank: identity.rank,
    slug: identity.slug,
    socialLinks,
    tagline: buildTagline(record, category, identity.audit),
    tags,
    totalTipsUsdcMicro: 0n,
    websiteUrl: record.websiteUrl,
    weeklyTipsUsdcMicro: 0n,
  } satisfies typeof projects.$inferInsert;
}

function loadMetadata(path: string) {
  if (!existsSync(path)) {
    return new Map<string, CuratedProjectMetadata>();
  }

  const parsed = JSON.parse(readFileSync(path, "utf8")) as Record<
    string,
    CuratedProjectMetadata
  >;

  if (
    Object.values(parsed).some(
      (metadata) =>
        !metadata ||
        typeof metadata.category !== "string" ||
        !Array.isArray(metadata.tags),
    )
  ) {
    throw new Error(
      "The metadata file is invalid. Pass a website audit as the fourth argument.",
    );
  }

  return new Map(
    Object.entries(parsed).map(([website, metadata]) => [
      getWebsiteKey(normalizeWebsite(website)),
      metadata,
    ]),
  );
}

function loadWebsiteAudit(path: string) {
  if (!existsSync(path)) {
    return new Map<string, WebsiteAudit>();
  }

  const parsed = JSON.parse(readFileSync(path, "utf8")) as {
    projects: WebsiteAudit[];
  };

  if (!Array.isArray(parsed.projects)) {
    throw new Error("The website audit file must contain a projects array.");
  }

  return new Map(
    parsed.projects.map((audit) => [
      getWebsiteKey(normalizeWebsite(audit.website)),
      audit,
    ]),
  );
}

function getAuditForRecord(
  record: SourceProjectRecord,
  auditByWebsite: Map<string, WebsiteAudit>,
) {
  if (!record.websiteUrl) {
    return undefined;
  }

  return auditByWebsite.get(getWebsiteKey(record.websiteUrl));
}

function findMetadata(
  record: SourceProjectRecord,
  metadataByWebsite: Map<string, CuratedProjectMetadata>,
) {
  if (!record.websiteUrl) {
    return null;
  }

  const exact = metadataByWebsite.get(getWebsiteKey(record.websiteUrl));

  if (exact) {
    return exact;
  }

  const domain = getStableDomainKey(record.websiteUrl);

  if (!domain) {
    return null;
  }

  for (const [website, metadata] of metadataByWebsite.entries()) {
    if (getStableDomainKey(`https://${website}`) === domain) {
      return metadata;
    }
  }

  return null;
}

function buildExistingIndexes(existingProjects: ExistingProject[]) {
  const byWebsite = new Map<string, ExistingProject>();
  const byDomainCandidates = new Map<string, ExistingProject[]>();
  const byNameCandidates = new Map<string, ExistingProject[]>();

  for (const project of existingProjects) {
    if (project.websiteUrl) {
      byWebsite.set(getWebsiteKey(project.websiteUrl), project);

      const domain = getStableDomainKey(project.websiteUrl);

      if (domain) {
        byDomainCandidates.set(domain, [
          ...(byDomainCandidates.get(domain) ?? []),
          project,
        ]);
      }
    }

    const name = getNameKey(project.name);
    byNameCandidates.set(name, [...(byNameCandidates.get(name) ?? []), project]);
  }

  return {
    byDomain: keepUniqueValues(byDomainCandidates),
    byName: keepUniqueValues(byNameCandidates),
    byWebsite,
  } satisfies ExistingProjectIndex;
}

function findExistingProject(
  record: SourceProjectRecord,
  indexes: ExistingProjectIndex,
) {
  const exact = record.websiteUrl
    ? indexes.byWebsite.get(getWebsiteKey(record.websiteUrl))
    : null;

  if (exact) {
    return exact;
  }

  const domain = record.websiteUrl ? getStableDomainKey(record.websiteUrl) : null;
  const domainMatch = domain ? indexes.byDomain.get(domain) : null;

  if (domainMatch) {
    return domainMatch;
  }

  return indexes.byName.get(getNameKey(record.name)) ?? null;
}

function keepUniqueValues<T>(candidates: Map<string, T[]>) {
  return new Map(
    [...candidates.entries()]
      .filter(([, values]) => values.length === 1)
      .map(([key, values]) => [key, values[0]]),
  );
}

function deduplicateByWebsite(records: SourceProjectRecord[]) {
  const bestByWebsite = new Map<string, SourceProjectRecord>();

  for (const record of records) {
    const key = getRecordKey(record);
    const current = bestByWebsite.get(key);

    if (!current || scoreRecord(record) > scoreRecord(current)) {
      bestByWebsite.set(key, record);
    }
  }

  return [...bestByWebsite.values()];
}

function scoreRecord(record: SourceProjectRecord) {
  const host = record.websiteUrl
    ? new URL(record.websiteUrl).hostname
        .replace(/^www\./, "")
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase()
    : "";
  const name = record.name.replace(/[^a-z0-9]/gi, "").toLowerCase();

  return (
    (record.logoUrl ? 4 : 0) +
    (record.projectXUrl ? 3 : 0) +
    (record.builderXUrl ? 2 : 0) +
    (host.includes(name) ? 5 : 0) +
    Math.min(record.name.length, 40) / 40
  );
}

function createUniqueSlug(
  record: SourceProjectRecord,
  existingSlugs: Set<string>,
  importedSlugs: Set<string>,
) {
  const base = slugifyProjectName(record.name);

  if (!existingSlugs.has(base) && !importedSlugs.has(base)) {
    return base;
  }

  const host = record.websiteUrl
    ? new URL(record.websiteUrl).hostname.replace(/^www\./, "").split(".")[0]
    : (record.projectXUrl
        ? new URL(record.projectXUrl).pathname.split("/").filter(Boolean)[0]
        : "project");
  let candidate = slugifyProjectName(`${base}-${host}`);
  let suffix = 2;

  while (existingSlugs.has(candidate) || importedSlugs.has(candidate)) {
    candidate = slugifyProjectName(`${base}-${host}-${suffix}`);
    suffix += 1;
  }

  return candidate;
}

function inferProjectMetadata(
  record: SourceProjectRecord,
  audit: WebsiteAudit | undefined,
): CuratedProjectMetadata {
  const text = [
    record.name,
    record.websiteUrl,
    record.sourceCategory,
    record.notes,
    audit?.title,
    audit?.description,
    ...(audit?.headings ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const tags = new Set<string>();
  const category = inferCategory(text, tags);

  addCategoryTags(category, tags);

  if (matches(text, ["usdc", "stablecoin", "stable coin"])) tags.add("USDC");
  if (matches(text, ["cctp", "bridge", "cross-chain", "crosschain"]))
    tags.add("Cross-chain");
  if (matches(text, ["escrow"])) tags.add("Escrow");
  if (matches(text, ["invoice", "checkout", "merchant"])) tags.add("Checkout");
  if (matches(text, ["ai", "agent", "assistant"])) tags.add("AI");
  if (matches(text, ["nft", "mint"])) tags.add("Minting");
  if (matches(text, ["analytics", "dashboard", "monitor"]))
    tags.add("Analytics");
  if (matches(text, ["swap", "liquidity", "amm"])) tags.add("Liquidity");

  return {
    category,
    tags: [...tags].slice(0, 4),
  };
}

function inferCategory(text: string, tags: Set<string>): ProjectCategory {
  if (matches(text, ["faucet"])) {
    tags.add("Developer Faucet");
    return "Faucets";
  }

  if (
    matches(text, [
      "game",
      "arcade",
      "2048",
      "snake",
      "blast",
      "mario",
      "quiz",
      "runner",
      "wharc",
      "play",
    ])
  ) {
    tags.add("Onchain Game");
    return "Games";
  }

  if (matches(text, ["nft", "collectible", "erc-721", "erc721"])) {
    tags.add("NFTs");
    return "NFTs";
  }

  if (
    matches(text, [
      "swap",
      "dex",
      "exchange",
      "trade",
      "trading",
      "perp",
      "liquidity",
      "amm",
    ])
  ) {
    tags.add("Trading");
    return "DEX";
  }

  if (
    matches(text, [
      "pay",
      "payment",
      "invoice",
      "checkout",
      "escrow",
      "tip",
      "send",
      "merchant",
      "subscription",
      "streaming",
      "commerce",
    ])
  ) {
    tags.add("Stablecoin Payments");
    return "Payments";
  }

  if (
    matches(text, [
      "lend",
      "borrow",
      "staking",
      "stake",
      "vault",
      "yield",
      "launchpad",
      "prediction",
      "defi",
      "dao",
      "treasury",
      "pump",
      "crowd",
    ])
  ) {
    tags.add("DeFi");
    return "DeFi";
  }

  if (
    matches(text, [
      "wallet",
      "portfolio",
      "balance",
      "custody",
      "account",
      "keys",
    ])
  ) {
    tags.add("Wallet UX");
    return "Wallets";
  }

  if (
    matches(text, [
      "dashboard",
      "analytics",
      "explorer",
      "scan",
      "index",
      "tracker",
      "monitor",
      "stats",
    ])
  ) {
    tags.add("Analytics");
    return "Dashboards";
  }

  if (
    matches(text, [
      "security",
      "audit",
      "privacy",
      "zk",
      "compliance",
      "trust score",
      "risk score",
    ])
  ) {
    tags.add("Risk Monitoring");
    return "Security";
  }

  if (
    matches(text, [
      "contract",
      "sdk",
      "developer",
      "dev tool",
      "tooling",
      "api",
      "terminal",
      "username",
    ])
  ) {
    tags.add("Developer Tools");
    return "Developer Tools";
  }

  if (
    matches(text, [
      "bridge",
      "cctp",
      "gateway",
      "rpc",
      "infra",
      "indexer",
      "governance",
    ])
  ) {
    tags.add("Infrastructure");
    return "Infrastructure";
  }

  if (
    matches(text, [
      "agent",
      "ai",
      "assistant",
      "llm",
      "mcp",
      "automation",
      "chat",
    ])
  ) {
    tags.add("AI Agents");
    return "AI Agents";
  }

  if (matches(text, ["chain", "blockchain", "network", "protocol"])) {
    tags.add("Blockchain");
    return "Blockchain";
  }

  return "Other";
}

function addCategoryTags(category: ProjectCategory, tags: Set<string>) {
  const defaults: Record<ProjectCategory, string[]> = {
    "AI Agents": ["Agent Workflows", "USDC Automation"],
    Blockchain: ["Arc Testnet", "Protocol"],
    Dashboards: ["Network Analytics", "Project Discovery"],
    DeFi: ["Stablecoins", "Onchain Finance"],
    DEX: ["Token Swaps", "Liquidity"],
    "Developer Tools": ["Builder Tools", "Smart Contracts"],
    Faucets: ["Testnet Tokens", "Developer Onboarding"],
    Games: ["Arcade", "Onchain Scores"],
    Infrastructure: ["Developer Infrastructure", "Arc Testnet"],
    NFTs: ["Digital Collectibles", "Minting"],
    Other: ["Arc Ecosystem", "Builder Showcase"],
    Payments: ["USDC", "Payment Flows"],
    Security: ["Risk Analysis", "Monitoring"],
    Wallets: ["Wallet UX", "Balances"],
  };

  for (const tag of defaults[category]) {
    tags.add(tag);
  }
}

function buildTagline(
  record: SourceProjectRecord,
  category: ProjectCategory,
  audit: WebsiteAudit | undefined,
) {
  const description = cleanSentence(audit?.description ?? "");

  if (description.length >= 20) {
    return truncate(description, 176);
  }

  return truncate(
    `${record.name} is listed under ${category} in the Arc ecosystem.`,
    176,
  );
}

function buildDescription(
  record: SourceProjectRecord,
  category: ProjectCategory,
  audit: WebsiteAudit | undefined,
) {
  const description = cleanSentence(audit?.description ?? "");
  const title = cleanSentence(audit?.title ?? "");

  if (description) {
    return `${record.name}: ${description} ArcRadar imported this profile from the supplied Arc ecosystem directory and links to the official project surface for review.`;
  }

  if (title && title.toLowerCase() !== record.name.toLowerCase()) {
    return `${record.name} appears as "${title}" in the supplied Arc ecosystem directory. ArcRadar classifies it under ${category} and links to the official project surface for review.`;
  }

  return `${record.name} is listed in the supplied Arc ecosystem directory. ArcRadar classifies it under ${category} and keeps the official website, X account, and logo available for project discovery.`;
}

function buildProfile(
  record: SourceProjectRecord,
  category: ProjectCategory,
  audit: WebsiteAudit | undefined,
) {
  const description = cleanSentence(audit?.description ?? "");
  const solution = description
    ? truncate(description, 260)
    : `The project presents a ${category.toLowerCase()} product or demo in the Arc ecosystem directory.`;

  return {
    problem: getCategoryProblem(category),
    solution,
    whyArc:
      "ArcRadar imported this project from the supplied Arc ecosystem directory. Review the official site and social links for the latest builder-provided details.",
  };
}

function getCategoryProblem(category: ProjectCategory) {
  const copy: Record<ProjectCategory, string> = {
    "AI Agents":
      "Builders need practical AI and automation experiments that can use stablecoin settlement.",
    Blockchain:
      "Arc ecosystem users need protocol and network experiments that make the testnet more useful.",
    Dashboards:
      "Builders and users need clearer visibility into activity, projects, and ecosystem signals.",
    DeFi: "Stablecoin finance experiments need usable interfaces for lending, vaults, markets, or treasury flows.",
    DEX: "Arc users need liquidity and trading surfaces that make testnet assets easier to move.",
    "Developer Tools":
      "Builders need tools that shorten the path from idea to deployed Arc application.",
    Faucets:
      "New users need a simple way to get testnet assets before they can transact.",
    Games:
      "Consumer apps need playful onchain experiences that make Arc easier to try.",
    Infrastructure:
      "Apps need reliable infrastructure, identity, indexing, governance, or crosschain primitives.",
    NFTs: "Creators need minting and collectible experiments that prove Arc consumer flows.",
    Other:
      "The ecosystem needs room for early experiments that do not fit a single product category yet.",
    Payments:
      "Stablecoin apps need simple payment, checkout, escrow, or transfer flows that users can understand.",
    Security:
      "Users need safer ways to inspect risk, privacy, compliance, and transaction behavior.",
    Wallets:
      "Users need clearer wallet, balance, custody, or account experiences for Arc activity.",
  };

  return copy[category];
}

function getSocialLinks(record: SourceProjectRecord): ProjectLink[] {
  const links: ProjectLink[] = [];

  if (record.websiteUrl) {
    links.push({ href: record.websiteUrl, label: "Website" });
  }

  if (record.projectXUrl) {
    links.push({ href: record.projectXUrl, label: "Project X" });
  }

  if (record.builderXUrl && record.builderXUrl !== record.projectXUrl) {
    links.push({ href: record.builderXUrl, label: "Builder X" });
  }

  return links;
}

function normalizeProjectName(rawName: string, websiteUrl: string) {
  const name = normalizeWhitespace(rawName);

  if (name && !/^https?:\/\//i.test(name)) {
    return truncate(name, 120);
  }

  const host = new URL(websiteUrl).hostname.replace(/^www\./, "").split(".")[0];
  return truncate(
    host
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    120,
  );
}

function normalizeWebsite(rawUrl: string) {
  const value = rawUrl.trim();
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);

  url.hash = "";
  url.search = "";
  return url.toString();
}

function normalizeOptionalUrl(rawUrl: string | undefined | null) {
  if (!rawUrl?.trim()) {
    return null;
  }

  const value = rawUrl.trim();
  const xHandle = value.match(/^@([A-Za-z0-9_]{1,32})$/);

  try {
    if (xHandle) {
      return normalizeWebsite(`https://x.com/${xHandle[1]}`);
    }

    if (/^(?:x|twitter)\.com\//i.test(value)) {
      return normalizeWebsite(`https://${value}`);
    }

    return normalizeWebsite(value);
  } catch {
    return null;
  }
}

function normalizeXUrl(rawUrl: string | undefined | null) {
  if (!rawUrl?.trim()) {
    return null;
  }

  const value = rawUrl.trim();
  const handle = value.match(/^@?([A-Za-z0-9_]{1,32})$/);

  if (handle) {
    return normalizeWebsite(`https://x.com/${handle[1]}`);
  }

  if (/^(?:x|twitter)\.com\//i.test(value)) {
    return normalizeWebsite(`https://${value}`);
  }

  try {
    const url = new URL(value);

    if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(
      url.hostname.toLowerCase(),
    )) {
      return null;
    }

    return normalizeWebsite(value);
  } catch {
    return null;
  }
}

function getBuilderName(
  builderXUrl: string | null,
  projectXUrl: string | null,
) {
  const preferredXUrl = builderXUrl ?? projectXUrl;

  if (!preferredXUrl) {
    return "Builder not listed";
  }

  const handle = new URL(preferredXUrl).pathname.split("/").filter(Boolean)[0];
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

function getField(row: CsvProjectRow, ...keys: Array<keyof CsvProjectRow>) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function getWebsiteKey(rawUrl: string) {
  const url = new URL(normalizeWebsite(rawUrl));
  const pathname = url.pathname.replace(/\/+$/g, "") || "/";

  return `${url.hostname.replace(/^www\./, "").toLowerCase()}${pathname.toLowerCase()}`;
}

function getRecordKey(record: SourceProjectRecord) {
  if (record.websiteUrl) {
    return `website:${getWebsiteKey(record.websiteUrl)}`;
  }

  if (record.projectXUrl) {
    return `x:${getWebsiteKey(record.projectXUrl)}`;
  }

  return `name:${getNameKey(record.name)}`;
}

function getStableDomainKey(rawUrl: string) {
  const host = new URL(normalizeWebsite(rawUrl)).hostname
    .replace(/^www\./, "")
    .toLowerCase();
  const sharedHosts = [
    "github.io",
    "netlify.app",
    "pages.dev",
    "vercel.app",
    "web.app",
  ];

  if (sharedHosts.some((sharedHost) => host.endsWith(sharedHost))) {
    return null;
  }

  const parts = host.split(".");

  if (parts.length < 2) {
    return host;
  }

  return parts.slice(-2).join(".");
}

function getNameKey(name: string) {
  return name.replace(/[^a-z0-9]+/gi, "").toLowerCase();
}

function matches(text: string, needles: string[]) {
  return needles.some((needle) => {
    const cleanNeedle = needle.toLowerCase();

    if (/^[a-z0-9]+$/i.test(cleanNeedle) && cleanNeedle.length <= 3) {
      return new RegExp(`(^|[^a-z0-9])${escapeRegExp(cleanNeedle)}(?=$|[^a-z0-9])`).test(
        text,
      );
    }

    return text.includes(cleanNeedle);
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanSentence(value: string) {
  return normalizeWhitespace(value)
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/^[|·\-–—:,\s]+/, "")
    .replace(/[|·\-–—:,\s]+$/, "");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  const clean = normalizeWhitespace(value);

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}
