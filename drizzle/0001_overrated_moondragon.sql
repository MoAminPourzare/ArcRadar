ALTER TABLE "projects" ADD COLUMN "supporters" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "total_tips_usdc_micro" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "weekly_tips_usdc_micro" bigint DEFAULT 0 NOT NULL;