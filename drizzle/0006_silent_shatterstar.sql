ALTER TABLE "project_submissions" DROP COLUMN "stage";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "stage";--> statement-breakpoint
DROP TYPE "public"."project_stage";