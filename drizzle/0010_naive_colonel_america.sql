CREATE TABLE "project_logo_assets" (
	"key" varchar(48) PRIMARY KEY NOT NULL,
	"content_type" varchar(32) NOT NULL,
	"bytes" "bytea" NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
