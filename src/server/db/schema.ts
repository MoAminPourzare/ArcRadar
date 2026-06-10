import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const projectStatus = pgEnum("project_status", [
  "live",
  "testnet",
  "building",
  "watchlist",
  "archived",
]);

export const projectStage = pgEnum("project_stage", [
  "Prototype",
  "Public Testnet",
  "Community",
  "Partner",
  "Research",
]);

export const projectCategory = pgEnum("project_category", [
  "AI Agents",
  "Payments",
  "DeFi",
  "Infrastructure",
  "Wallets",
  "Developer Tools",
]);

export const submissionStatus = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    tagline: varchar("tagline", { length: 180 }).notNull(),
    description: text("description").notNull(),
    category: projectCategory("category").notNull(),
    status: projectStatus("status").default("watchlist").notNull(),
    stage: projectStage("stage").default("Prototype").notNull(),
    builderName: varchar("builder_name", { length: 120 }).notNull(),
    builderWallet: varchar("builder_wallet", { length: 42 }),
    projectWallet: varchar("project_wallet", { length: 42 }).notNull(),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    accent: varchar("accent", { length: 24 }).default("mint").notNull(),
    lastSignal: varchar("last_signal", { length: 160 }),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    profile: jsonb("profile")
      .$type<{
        builderNote: string;
        problem: string;
        solution: string;
        whyArc: string;
        idealFor: string[];
        roadmap: Array<{ label: string; status: string }>;
        curationNotes: string[];
      }>()
      .notNull(),
    activity: jsonb("activity")
      .$type<Array<{ label: string; detail: string; timestamp: string }>>()
      .default([])
      .notNull(),
    socialLinks: jsonb("social_links")
      .$type<Array<{ label: string; href: string }>>()
      .default([])
      .notNull(),
    featured: boolean("featured").default(false).notNull(),
    rank: integer("rank").default(0).notNull(),
    signalScore: integer("signal_score").default(0).notNull(),
    launches: integer("launches").default(0).notNull(),
    supporters: integer("supporters").default(0).notNull(),
    totalTipsUsdcMicro: bigint("total_tips_usdc_micro", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    weeklyTipsUsdcMicro: bigint("weekly_tips_usdc_micro", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("projects_slug_idx").on(table.slug),
    index("projects_category_idx").on(table.category),
    index("projects_status_idx").on(table.status),
  ],
);

export const tips = pgTable(
  "tips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    tipperAddress: varchar("tipper_address", { length: 42 }).notNull(),
    recipientAddress: varchar("recipient_address", { length: 42 }).notNull(),
    amountUsdcMicro: bigint("amount_usdc_micro", { mode: "bigint" }).notNull(),
    transactionHash: varchar("transaction_hash", { length: 66 }).notNull(),
    message: varchar("message", { length: 280 }),
    blockNumber: bigint("block_number", { mode: "bigint" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("tips_transaction_hash_idx").on(table.transactionHash),
    index("tips_block_number_idx").on(table.blockNumber),
    index("tips_created_at_idx").on(table.createdAt),
    index("tips_project_id_idx").on(table.projectId),
    index("tips_tipper_address_idx").on(table.tipperAddress),
  ],
);

export const tipIndexerState = pgTable("tip_indexer_state", {
  id: varchar("id", { length: 64 }).primaryKey(),
  contractAddress: varchar("contract_address", { length: 42 }).notNull(),
  lastProcessedBlock: bigint("last_processed_block", {
    mode: "bigint",
  })
    .default(sql`0`)
    .notNull(),
  lastProcessedAt: timestamp("last_processed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projectSubmissions = pgTable(
  "project_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 96 }),
    name: varchar("name", { length: 120 }).notNull(),
    tagline: varchar("tagline", { length: 180 }).notNull(),
    description: text("description").notNull(),
    category: projectCategory("category").notNull(),
    stage: projectStage("stage").default("Prototype").notNull(),
    builderName: varchar("builder_name", { length: 120 }).notNull(),
    contact: varchar("contact", { length: 160 }),
    projectWallet: varchar("project_wallet", { length: 42 }),
    websiteUrl: text("website_url"),
    xUrl: text("x_url"),
    discordUrl: text("discord_url"),
    githubUrl: text("github_url"),
    status: submissionStatus("status").default("pending").notNull(),
    reviewNotes: text("review_notes"),
    publishedProjectId: uuid("published_project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("project_submissions_status_idx").on(table.status),
    index("project_submissions_category_idx").on(table.category),
    index("project_submissions_slug_idx").on(table.slug),
    index("project_submissions_published_project_id_idx").on(
      table.publishedProjectId,
    ),
  ],
);
