CREATE TYPE "public"."agent_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "agent_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"agent_id" varchar(64) NOT NULL,
	"title" varchar(180) NOT NULL,
	"summary" text NOT NULL,
	"score" integer,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(64) NOT NULL,
	"project_id" uuid,
	"user_wallet" varchar(42),
	"status" "agent_run_status" DEFAULT 'pending' NOT NULL,
	"payment_transaction_hash" varchar(66),
	"payment_amount_usdc_micro" bigint DEFAULT 0 NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "agent_reports" ADD CONSTRAINT "agent_reports_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_reports" ADD CONSTRAINT "agent_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_reports_agent_id_idx" ON "agent_reports" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_reports_created_at_idx" ON "agent_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_reports_project_id_idx" ON "agent_reports" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "agent_reports_run_id_idx" ON "agent_reports" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "agent_runs_agent_id_idx" ON "agent_runs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_runs_project_id_idx" ON "agent_runs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "agent_runs_status_idx" ON "agent_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_runs_payment_transaction_hash_idx" ON "agent_runs" USING btree ("payment_transaction_hash");