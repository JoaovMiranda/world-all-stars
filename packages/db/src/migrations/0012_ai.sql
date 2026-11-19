CREATE TABLE "ai_invocations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"model_id" uuid NOT NULL,
	"prompt_version_id" uuid NOT NULL,
	"task" text NOT NULL,
	"input_ref" text NOT NULL,
	"input_hash" text NOT NULL,
	"output" jsonb,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"estimated_cost" real DEFAULT 0 NOT NULL,
	"status" "ai_invocation_status" NOT NULL,
	"error" text,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"validation_level" integer DEFAULT 0 NOT NULL,
	"review_outcome" text
);
--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" text DEFAULT '' NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"cost_per1k_in" real DEFAULT 0 NOT NULL,
	"cost_per1k_out" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" text NOT NULL,
	"task" text NOT NULL,
	"template_hash" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_invocations" ADD CONSTRAINT "ai_invocations_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_invocations" ADD CONSTRAINT "ai_invocations_prompt_version_id_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_invocations_model_id_task_index" ON "ai_invocations" USING btree ("model_id","task") WHERE "ai_invocations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ai_invocations_input_hash_index" ON "ai_invocations" USING btree ("input_hash") WHERE "ai_invocations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_models_provider_name_version_index" ON "ai_models" USING btree ("provider","name","version") WHERE "ai_models"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_versions_task_version_index" ON "prompt_versions" USING btree ("task","version") WHERE "prompt_versions"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "ai_extraction_queue" ADD COLUMN "invocation_id" uuid REFERENCES ai_invocations(id)--> statement-breakpoint
SELECT protect_all_tables()
