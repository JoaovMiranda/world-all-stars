CREATE TABLE "ingestion_job_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"run_id" uuid NOT NULL,
	"item_key" text NOT NULL,
	"status" "job_item_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_by" text,
	"locked_until" timestamp with time zone,
	"last_error" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checkpoint" jsonb,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ingestion_logs" ADD COLUMN "item_id" uuid;--> statement-breakpoint
ALTER TABLE "ingestion_logs" ADD COLUMN "stage" text;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD COLUMN "params" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD COLUMN "params_hash" text;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD COLUMN "priority" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD COLUMN "cancel_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD COLUMN "checkpoint" jsonb;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD COLUMN "requested_by" uuid;--> statement-breakpoint
ALTER TABLE "ingestion_job_items" ADD CONSTRAINT "ingestion_job_items_run_id_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ingestion_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ingestion_job_items_run_id_item_key_index" ON "ingestion_job_items" USING btree ("run_id","item_key") WHERE "ingestion_job_items"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ingestion_job_items_claim_idx" ON "ingestion_job_items" USING btree ("status","next_attempt_at") WHERE "ingestion_job_items"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ingestion_runs_active_params_uq" ON "ingestion_runs" ("params_hash") WHERE deleted_at IS NULL AND params_hash IS NOT NULL AND status IN ('running')--> statement-breakpoint
SELECT protect_all_tables()
