CREATE TABLE "ranking_calculation_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"methodology_id" uuid NOT NULL,
	"ruleset_id" uuid NOT NULL,
	"algorithm_version" text NOT NULL,
	"methodology_version" text NOT NULL,
	"ranking_key" text NOT NULL,
	"scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"input_manifest" jsonb NOT NULL,
	"input_hash" text NOT NULL,
	"output_hash" text,
	"status" text NOT NULL,
	"error" text,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ranking_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"competitor_id" uuid NOT NULL,
	"rank" integer,
	"rank_tied" boolean DEFAULT false NOT NULL,
	"band" text,
	"score" real,
	"eligible" boolean DEFAULT true NOT NULL,
	"eligibility_reason" text
);
--> statement-breakpoint
CREATE TABLE "ranking_entry_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entry_id" uuid NOT NULL,
	"evidence_type" text NOT NULL,
	"evidence_id" uuid NOT NULL,
	"contribution" real NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "ranking_entry_metrics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entry_id" uuid NOT NULL,
	"metric" text NOT NULL,
	"value" real,
	"display" text
);
--> statement-breakpoint
CREATE TABLE "ranking_methodologies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"key" text NOT NULL,
	"sport_id" uuid,
	"output_kind" "ranking_output_kind" NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranking_rulesets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" text NOT NULL,
	"methodology_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"config_hash" text NOT NULL,
	"activated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ranking_snapshot_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "ranking_snapshots" (
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
	"ranking_key" text NOT NULL,
	"title" text NOT NULL,
	"status" "ranking_snapshot_status" DEFAULT 'calculated' NOT NULL,
	"input_hash" text NOT NULL,
	"output_hash" text NOT NULL,
	"published_at" timestamp with time zone,
	"approvals_required" integer DEFAULT 2 NOT NULL,
	"approvals_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ranking_calculation_runs" ADD CONSTRAINT "ranking_calculation_runs_methodology_id_ranking_methodologies_id_fk" FOREIGN KEY ("methodology_id") REFERENCES "public"."ranking_methodologies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_calculation_runs" ADD CONSTRAINT "ranking_calculation_runs_ruleset_id_ranking_rulesets_id_fk" FOREIGN KEY ("ruleset_id") REFERENCES "public"."ranking_rulesets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_snapshot_id_ranking_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."ranking_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_entry_items" ADD CONSTRAINT "ranking_entry_items_entry_id_ranking_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."ranking_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_entry_metrics" ADD CONSTRAINT "ranking_entry_metrics_entry_id_ranking_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."ranking_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_methodologies" ADD CONSTRAINT "ranking_methodologies_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_rulesets" ADD CONSTRAINT "ranking_rulesets_methodology_id_ranking_methodologies_id_fk" FOREIGN KEY ("methodology_id") REFERENCES "public"."ranking_methodologies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_snapshot_approvals" ADD CONSTRAINT "ranking_snapshot_approvals_snapshot_id_ranking_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."ranking_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_run_id_ranking_calculation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ranking_calculation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ranking_calculation_runs_ranking_key_started_at_index" ON "ranking_calculation_runs" USING btree ("ranking_key","started_at") WHERE "ranking_calculation_runs"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_entries_snapshot_id_competitor_id_index" ON "ranking_entries" USING btree ("snapshot_id","competitor_id") WHERE "ranking_entries"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ranking_entries_competitor_id_index" ON "ranking_entries" USING btree ("competitor_id") WHERE "ranking_entries"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ranking_entry_items_entry_id_index" ON "ranking_entry_items" USING btree ("entry_id") WHERE "ranking_entry_items"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_entry_metrics_entry_id_metric_index" ON "ranking_entry_metrics" USING btree ("entry_id","metric") WHERE "ranking_entry_metrics"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_methodologies_key_index" ON "ranking_methodologies" USING btree ("key") WHERE "ranking_methodologies"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_rulesets_methodology_id_version_index" ON "ranking_rulesets" USING btree ("methodology_id","version") WHERE "ranking_rulesets"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_snapshot_approvals_snapshot_id_admin_user_id_index" ON "ranking_snapshot_approvals" USING btree ("snapshot_id","admin_user_id") WHERE "ranking_snapshot_approvals"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ranking_snapshots_ranking_key_status_index" ON "ranking_snapshots" USING btree ("ranking_key","status") WHERE "ranking_snapshots"."deleted_at" is null;--> statement-breakpoint
-- E04: a published snapshot (and its entries) never changes; a correction is a new snapshot.
CREATE OR REPLACE FUNCTION forbid_published_snapshot_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'published' AND (NEW.status NOT IN ('published', 'archived') OR NEW.output_hash <> OLD.output_hash OR NEW.input_hash <> OLD.input_hash OR NEW.run_id <> OLD.run_id) THEN
    RAISE EXCEPTION 'Published ranking snapshot % is immutable: publish a new snapshot instead', OLD.id;
  END IF;
  RETURN NEW;
END;
$$--> statement-breakpoint
CREATE TRIGGER forbid_published_snapshot_change BEFORE UPDATE ON "ranking_snapshots" FOR EACH ROW EXECUTE FUNCTION forbid_published_snapshot_change()--> statement-breakpoint
CREATE OR REPLACE FUNCTION forbid_published_entry_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM ranking_snapshots s WHERE s.id = COALESCE(OLD.snapshot_id, NEW.snapshot_id) AND s.status IN ('published', 'archived')) THEN
    RAISE EXCEPTION 'Entries of a published ranking snapshot are immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$--> statement-breakpoint
CREATE TRIGGER forbid_published_entry_change BEFORE INSERT OR UPDATE ON "ranking_entries" FOR EACH ROW EXECUTE FUNCTION forbid_published_entry_change()--> statement-breakpoint
SELECT protect_all_tables()
