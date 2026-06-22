import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { parse } from "csv-parse/sync";

const csvPath = resolve(
  process.cwd(),
  process.argv[2] ?? "src/data/imports/arc-ecosystem-logos.csv",
);
const outputPath = resolve(
  process.cwd(),
  process.argv[3] ?? ".tmp/project-logo-audit.json",
);
const records = parse(readFileSync(csvPath, "utf8"), {
  bom: true,
  columns: true,
  relax_column_count: true,
  skip_empty_lines: true,
  trim: true,
}) as CsvLogoRow[];
const uniqueLogos = deduplicateLogos(records);
const results: LogoAudit[] = [];

for (let index = 0; index < uniqueLogos.length; index += 6) {
  const batch = uniqueLogos.slice(index, index + 6);
  results.push(...(await Promise.all(batch.map(auditLogo))));
  console.log(
    `Audited ${Math.min(index + batch.length, uniqueLogos.length)}/${uniqueLogos.length}`,
  );
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      auditedAt: new Date().toISOString(),
      logos: results,
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

type CsvLogoRow = {
  "Logo URL"?: string;
  "Project Name"?: string;
};

type LogoAudit = {
  contentType: string | null;
  error: string | null;
  finalUrl: string;
  name: string;
  ok: boolean;
  status: number | null;
  url: string;
};

async function auditLogo(record: CsvLogoRow): Promise<LogoAudit> {
  const rawUrl = record["Logo URL"]?.trim() ?? "";
  let url: string;

  try {
    url = normalizeUrl(rawUrl);
  } catch (error) {
    return {
      contentType: null,
      error: error instanceof Error ? error.message : "Invalid logo URL",
      finalUrl: rawUrl,
      name: record["Project Name"]?.trim() || "Unnamed project",
      ok: false,
      status: null,
      url: rawUrl,
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
          Range: "bytes=0-31",
          "User-Agent": "ArcRadarLogoAudit/1.0",
        },
        redirect: "follow",
        signal: controller.signal,
      });
      const contentType =
        response.headers.get("content-type")?.split(";")[0] ?? null;
      const ok = response.ok && Boolean(contentType?.startsWith("image/"));
      const retryable = response.status === 429 || response.status >= 500;

      await response.body?.cancel();

      if (!ok && retryable && attempt < 2) {
        await wait(1_000 * 2 ** attempt);
        continue;
      }

      return {
        contentType,
        error: ok
          ? null
          : `Expected an image response, received HTTP ${response.status}`,
        finalUrl: response.url,
        name: record["Project Name"]?.trim() || "Unnamed project",
        ok,
        status: response.status,
        url,
      };
    } catch (error) {
      if (attempt < 2) {
        await wait(1_000 * 2 ** attempt);
        continue;
      }

      return {
        contentType: null,
        error: error instanceof Error ? error.message : String(error),
        finalUrl: url,
        name: record["Project Name"]?.trim() || "Unnamed project",
        ok: false,
        status: null,
        url,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Logo audit exhausted all retry attempts.");
}

function wait(milliseconds: number) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function deduplicateLogos(records: CsvLogoRow[]) {
  const byUrl = new Map<string, CsvLogoRow>();

  for (const record of records) {
    const rawUrl = record["Logo URL"]?.trim();

    if (!rawUrl) continue;

    try {
      const url = normalizeUrl(rawUrl);
      if (!byUrl.has(url)) byUrl.set(url, record);
    } catch {
      // Invalid URLs are represented once in the final audit.
      byUrl.set(rawUrl, record);
    }
  }

  return [...byUrl.values()];
}

function normalizeUrl(rawUrl: string) {
  const value = rawUrl.trim();
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);

  if (url.protocol !== "https:") {
    throw new Error("Logo URLs must use HTTPS.");
  }

  url.hash = "";
  return url.toString();
}
