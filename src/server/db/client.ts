import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";

import * as schema from "@/server/db/schema";

type HyperdriveBinding = {
  connectionString: string;
};

export const getDb = cache(() => {
  const connectionString = getRuntimeConnectionString();

  if (!connectionString) {
    return null;
  }

  const pool = new Pool({
    allowExitOnIdle: true,
    connectionString,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 5_000,
    max: 1,
    maxUses: 1,
  });

  return drizzle({ client: pool, schema });
});

function getRuntimeConnectionString() {
  try {
    const { env } = getCloudflareContext();
    const hyperdrive = (env as CloudflareEnv & { HYPERDRIVE?: HyperdriveBinding })
      .HYPERDRIVE;

    if (hyperdrive?.connectionString) {
      return hyperdrive.connectionString;
    }

    if (process.env.NODE_ENV === "production") {
      return null;
    }
  } catch {
    // Node.js development and maintenance tasks use DATABASE_URL directly.
  }

  return process.env.DATABASE_URL ?? null;
}
