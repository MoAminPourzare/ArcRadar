ALTER TABLE "project_submissions" ADD COLUMN "slug" varchar(96);--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "published_project_id" uuid;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_published_project_id_projects_id_fk" FOREIGN KEY ("published_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_submissions_slug_idx" ON "project_submissions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "project_submissions_published_project_id_idx" ON "project_submissions" USING btree ("published_project_id");