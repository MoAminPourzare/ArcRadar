ALTER TYPE "public"."project_category" ADD VALUE 'Blockchain' BEFORE 'Payments';--> statement-breakpoint
ALTER TYPE "public"."project_category" ADD VALUE 'Dashboards' BEFORE 'Payments';--> statement-breakpoint
ALTER TYPE "public"."project_category" ADD VALUE 'DEX' BEFORE 'Payments';--> statement-breakpoint
ALTER TYPE "public"."project_category" ADD VALUE 'Faucets' BEFORE 'Infrastructure';--> statement-breakpoint
ALTER TYPE "public"."project_category" ADD VALUE 'Games' BEFORE 'Infrastructure';--> statement-breakpoint
ALTER TYPE "public"."project_category" ADD VALUE 'NFTs' BEFORE 'Wallets';--> statement-breakpoint
ALTER TYPE "public"."project_category" ADD VALUE 'Other' BEFORE 'Wallets';--> statement-breakpoint
ALTER TYPE "public"."project_category" ADD VALUE 'Security' BEFORE 'Wallets';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "project_wallet" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project_submissions" DROP COLUMN "discord_url";