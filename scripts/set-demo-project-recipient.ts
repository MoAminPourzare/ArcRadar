import { loadLocalEnv } from "../src/server/env/load-local-env.js";
import { projects } from "../src/server/db/schema.js";
import { drizzle } from "drizzle-orm/postgres-js";
import { inArray } from "drizzle-orm";
import postgres from "postgres";
import { getAddress, isAddress } from "viem";

loadLocalEnv();

const demoProjectSlugs = [
  "arc-escrow",
  "arc-commerce",
  "unified-usdc",
  "arc-router",
  "arc-index-kit",
  "arc-dev-console",
] as const;
const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const rawRecipient = process.env.TIP_DEMO_RECIPIENT_ADDRESS;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required.");
}

if (!rawRecipient || !isAddress(rawRecipient)) {
  throw new Error("TIP_DEMO_RECIPIENT_ADDRESS must be a valid address.");
}

const recipient = getAddress(rawRecipient);
const client = postgres(databaseUrl, { max: 1 });
const database = drizzle(client);

try {
  const updatedProjects = await database
    .update(projects)
    .set({
      projectWallet: recipient,
      updatedAt: new Date(),
    })
    .where(inArray(projects.slug, [...demoProjectSlugs]))
    .returning({ slug: projects.slug });

  console.log(
    JSON.stringify(
      {
        recipient,
        updatedProjectSlugs: updatedProjects.map((project) => project.slug),
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
