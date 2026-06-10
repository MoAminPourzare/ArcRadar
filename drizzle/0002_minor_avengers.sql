CREATE TABLE "tip_indexer_state" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"contract_address" varchar(42) NOT NULL,
	"last_processed_block" bigint DEFAULT 0 NOT NULL,
	"last_processed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tips_block_number_idx" ON "tips" USING btree ("block_number");--> statement-breakpoint
CREATE INDEX "tips_created_at_idx" ON "tips" USING btree ("created_at");