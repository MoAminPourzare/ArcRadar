import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { parse } from "csv-parse/sync";

const csvPath = resolve(
  process.cwd(),
  process.argv[2] ?? "src/data/imports/arc-projects.csv",
);
const outputPath = resolve(
  process.cwd(),
  process.argv[3] ?? ".tmp/project-website-audit.json",
);
const records = parse(readFileSync(csvPath, "utf8"), {
  bom: true,
  columns: true,
  relax_column_count: true,
  skip_empty_lines: true,
  trim: true,
}) as CsvProjectRow[];
const uniqueRecords = deduplicateByWebsite(records);
const results: WebsiteAudit[] = [];

for (let index = 0; index < uniqueRecords.length; index += 5) {
  const batch = uniqueRecords.slice(index, index + 5);
  const audits = await Promise.all(batch.map(auditWebsite));
  results.push(...audits);
  console.log(
    `Audited ${Math.min(index + batch.length, uniqueRecords.length)}/${uniqueRecords.length}`,
  );
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      auditedAt: new Date().toISOString(),
      projects: results,
      source: csvPath,
    },
    null,
    2,
  )}\n`,
);

console.log(
  JSON.stringify(
    {
      failed: results.filter((result) => !result.ok).length,
      output: outputPath,
      succeeded: results.filter((result) => result.ok).length,
      total: results.length,
    },
    null,
    2,
  ),
);

type CsvProjectRow = {
  Category?: string;
  "Project Link": string;
  "Project Name": string;
};

type WebsiteAudit = {
  category: string;
  description: string | null;
  error: string | null;
  finalUrl: string;
  headings: string[];
  name: string;
  ok: boolean;
  status: number | null;
  text: string;
  title: string | null;
  website: string;
};

async function auditWebsite(record: CsvProjectRow): Promise<WebsiteAudit> {
  const website = normalizeWebsite(record["Project Link"]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(website, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; ArcRadarProjectAudit/1.0; +https://github.com/)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";
    const html = contentType.includes("text/html")
      ? await response.text()
      : "";

    return {
      category: record.Category?.trim() || "Uncategorized",
      description: firstMatch(html, [
        /<meta[^>]+(?:name|property)=["'](?:description|og:description|twitter:description)["'][^>]+content=["']([^"']*)["']/i,
        /<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["'](?:description|og:description|twitter:description)["']/i,
      ]),
      error: response.ok ? null : `HTTP ${response.status}`,
      finalUrl: response.url,
      headings: extractMatches(
        html,
        /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi,
        12,
      ),
      name: normalizeWhitespace(record["Project Name"]),
      ok: response.ok,
      status: response.status,
      text: extractVisibleText(html).slice(0, 4_000),
      title: firstMatch(html, [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i,
        /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i,
        /<title[^>]*>([\s\S]*?)<\/title>/i,
      ]),
      website,
    };
  } catch (error) {
    return {
      category: record.Category?.trim() || "Uncategorized",
      description: null,
      error: error instanceof Error ? error.message : String(error),
      finalUrl: website,
      headings: [],
      name: normalizeWhitespace(record["Project Name"]),
      ok: false,
      status: null,
      text: "",
      title: null,
      website,
    };
  } finally {
    clearTimeout(timeout);
  }
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

function extractMatches(html: string, pattern: RegExp, limit: number) {
  return Array.from(html.matchAll(pattern))
    .slice(0, limit)
    .map((match) => cleanHtml(match[1]))
    .filter(Boolean);
}

function extractVisibleText(html: string) {
  return cleanHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function firstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return cleanHtml(match[1]);
    }
  }

  return null;
}

function cleanHtml(value: string) {
  return normalizeWhitespace(
    value
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&nbsp;/gi, " "),
  );
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeWebsite(rawUrl: string) {
  const value = rawUrl.trim();
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);

  url.hash = "";
  return url.toString();
}
