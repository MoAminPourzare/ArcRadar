CREATE TYPE "public"."project_category" AS ENUM('AI Agents', 'Payments', 'DeFi', 'Infrastructure', 'Wallets', 'Developer Tools');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('Prototype', 'Public Testnet', 'Community', 'Partner', 'Research');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('live', 'testnet', 'building', 'watchlist', 'archived');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "project_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"tagline" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"category" "project_category" NOT NULL,
	"stage" "project_stage" DEFAULT 'Prototype' NOT NULL,
	"builder_name" varchar(120) NOT NULL,
	"contact" varchar(160),
	"project_wallet" varchar(42),
	"website_url" text,
	"x_url" text,
	"discord_url" text,
	"github_url" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(96) NOT NULL,
	"name" varchar(120) NOT NULL,
	"tagline" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"category" "project_category" NOT NULL,
	"status" "project_status" DEFAULT 'watchlist' NOT NULL,
	"stage" "project_stage" DEFAULT 'Prototype' NOT NULL,
	"builder_name" varchar(120) NOT NULL,
	"builder_wallet" varchar(42),
	"project_wallet" varchar(42) NOT NULL,
	"website_url" text,
	"logo_url" text,
	"accent" varchar(24) DEFAULT 'mint' NOT NULL,
	"last_signal" varchar(160),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"profile" jsonb NOT NULL,
	"activity" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"social_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"signal_score" integer DEFAULT 0 NOT NULL,
	"launches" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"tipper_address" varchar(42) NOT NULL,
	"recipient_address" varchar(42) NOT NULL,
	"amount_usdc_micro" bigint NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"message" varchar(280),
	"block_number" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_submissions_status_idx" ON "project_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_submissions_category_idx" ON "project_submissions" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tips_transaction_hash_idx" ON "tips" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX "tips_project_id_idx" ON "tips" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tips_tipper_address_idx" ON "tips" USING btree ("tipper_address");