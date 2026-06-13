import { loadLocalEnv } from "@/server/env/load-local-env";
import { tips } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

loadLocalEnv();

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required.");
}

const client = postgres(databaseUrl, { max: 1 });
const database = drizzle(client);

try {
  const removed = await database
    .delete(tips)
    .where(eq(tips.tipperAddress, tips.recipientAddress))
    .returning({ id: tips.id });

  console.log(
    JSON.stringify(
      {
        removedSelfTips: removed.length,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
