import { count, eq, isNull, sql } from "drizzle-orm";
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
  const [totals, withoutWallet, categoryRows, duplicateSlugs, discordLinks] =
    await Promise.all([
      database.select({ count: count() }).from(projects),
      database
        .select({ count: count() })
        .from(projects)
        .where(isNull(projects.projectWallet)),
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
        select count(*)::int as count
        from projects
        where social_links @> '[{"label":"Discord"}]'::jsonb
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
        importedProjects: importedCount[0]?.count ?? 0,
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
