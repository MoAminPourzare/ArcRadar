DROP INDEX "projects_status_idx";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "signal_score";--> statement-breakpoint
DROP TYPE "public"."project_status";