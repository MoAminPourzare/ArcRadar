import { count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { projects } from "@/server/db/schema";
import { loadLocalEnv } from "@/server/env/load-local-env";

loadLocalEnv();

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required.");
}

const client = postgres(databaseUrl, { max: 1 });
const database = drizzle(client);

try {
  const [
    totals,
    withoutWallet,
    withLogo,
    categoryRows,
    duplicateSlugs,
    duplicateWebsites,
    discordLinks,
    invalidLogoUrls,
    invalidWebsiteUrls,
  ] =
    await Promise.all([
      database.select({ count: count() }).from(projects),
      database
        .select({ count: count() })
        .from(projects)
        .where(isNull(projects.projectWallet)),
      database
        .select({ count: count() })
        .from(projects)
        .where(isNotNull(projects.logoUrl)),
      database
        .select({ category: projects.category, count: count() })
        .from(projects)
        .groupBy(projects.category)
        .orderBy(projects.category),
      database.execute(sql`
        select slug, count(*)::int as count
        from projects
        group by slug
        having count(*) > 1
      `),
      database.execute(sql`
        select website_url, count(*)::int as count
        from projects
        where website_url is not null
        group by website_url
        having count(*) > 1
      `),
      database.execute(sql`
        select count(*)::int as count
        from projects
        where social_links @> '[{"label":"Discord"}]'::jsonb
      `),
      database.execute(sql`
        select count(*)::int as count
        from projects
        where logo_url is not null and logo_url !~ '^https://'
      `),
      database.execute(sql`
        select count(*)::int as count
        from projects
        where website_url is not null and website_url !~ '^https://'
      `),
    ]);

  const importedCount = await database
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.lastSignal, "Imported from the Arc ecosystem project directory"));

  console.log(
    JSON.stringify(
      {
        categories: Object.fromEntries(
          categoryRows.map((row) => [row.category, row.count]),
        ),
        discordProjectLinks: Number(discordLinks[0]?.count ?? 0),
        duplicateSlugs: duplicateSlugs.length,
        duplicateWebsites: duplicateWebsites.length,
        importedProjects: importedCount[0]?.count ?? 0,
        invalidLogoUrls: Number(invalidLogoUrls[0]?.count ?? 0),
        invalidWebsiteUrls: Number(invalidWebsiteUrls[0]?.count ?? 0),
        projectsWithLogo: withLogo[0]?.count ?? 0,
        projectsWithoutTipWallet: withoutWallet[0]?.count ?? 0,
        totalProjects: totals[0]?.count ?? 0,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
