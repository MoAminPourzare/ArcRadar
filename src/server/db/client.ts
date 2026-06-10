import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/server/db/schema";

const databaseUrl = process.env.DATABASE_URL;
const poolMax = readPositiveInteger(process.env.DATABASE_POOL_MAX, 5);

export const db = databaseUrl
  ? drizzle(
      postgres(databaseUrl, {
        connect_timeout: 10,
        idle_timeout: 20,
        max: poolMax,
      }),
      { schema },
    )
  : null;

function readPositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
