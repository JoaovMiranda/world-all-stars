CREATE TABLE "classifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"edition_id" uuid NOT NULL,
	"stage_id" uuid,
	"event_id" uuid,
	"kind_id" uuid NOT NULL,
	"label" text NOT NULL,
	"computed_by_source" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"edition_id" uuid NOT NULL,
	"event_id" uuid,
	"competitor_id" uuid NOT NULL,
	"representation_id" uuid,
	"status_id" uuid NOT NULL,
	"seed" integer,
	"bib" text,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "competition_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"edition_id" uuid NOT NULL,
	"stage_id" uuid,
	"sport_id" uuid NOT NULL,
	"format_id" uuid NOT NULL,
	"composition_id" uuid NOT NULL,
	"category_set_id" uuid,
	"ruleset_id" uuid,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"scope" text NOT NULL,
	"scope_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"rank" integer,
	"rank_tied" boolean DEFAULT false NOT NULL,
	"status_id" uuid NOT NULL,
	"extension_schema_id" uuid,
	"extension" jsonb,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "competition_stages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"edition_id" uuid NOT NULL,
	"parent_stage_id" uuid,
	"stage_kind_id" uuid NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"end_date" date,
	"city_id" uuid
);
--> statement-breakpoint
CREATE TABLE "competitor_stat_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"competitor_id" uuid NOT NULL,
	"sport_id" uuid,
	"period_id" uuid NOT NULL,
	"period_label" text DEFAULT 'career' NOT NULL,
	"metric_id" uuid NOT NULL,
	"value_numeric" real,
	"value_text" text,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "contest_participations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"contest_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "contest_sides" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"contest_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"side" integer NOT NULL,
	"outcome_id" uuid
);
--> statement-breakpoint
CREATE TABLE "contests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"event_id" uuid NOT NULL,
	"stage_id" uuid,
	"label" text NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"date" date,
	"calendar_day_id" uuid,
	"city_id" uuid
);
--> statement-breakpoint
CREATE TABLE "entry_members" (
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
	"person_id" uuid NOT NULL,
	"role_id" uuid,
	"registration_status_id" uuid NOT NULL,
	"appearance_id" uuid NOT NULL,
	"position_id" uuid,
	"shirt_number" integer,
	"verification" text DEFAULT 'provisional' NOT NULL,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "result_metrics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"result_id" uuid NOT NULL,
	"metric_id" uuid NOT NULL,
	"value_numeric" real,
	"value_text" text,
	"unit_original" text,
	"value_original" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_edition_id_competition_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."competition_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_stage_id_competition_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_event_id_competition_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."competition_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_kind_id_domain_values_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_edition_id_competition_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."competition_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_event_id_competition_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."competition_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_representation_id_entity_registry_id_fk" FOREIGN KEY ("representation_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_status_id_domain_values_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_edition_id_competition_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."competition_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_stage_id_competition_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_format_id_domain_values_id_fk" FOREIGN KEY ("format_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_composition_id_domain_values_id_fk" FOREIGN KEY ("composition_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_category_set_id_category_sets_id_fk" FOREIGN KEY ("category_set_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_ruleset_id_competition_rulesets_id_fk" FOREIGN KEY ("ruleset_id") REFERENCES "public"."competition_rulesets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_entry_id_competition_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_status_id_domain_values_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_extension_schema_id_extension_schemas_id_fk" FOREIGN KEY ("extension_schema_id") REFERENCES "public"."extension_schemas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_stages" ADD CONSTRAINT "competition_stages_edition_id_competition_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."competition_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_stages" ADD CONSTRAINT "competition_stages_parent_stage_id_competition_stages_id_fk" FOREIGN KEY ("parent_stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_stages" ADD CONSTRAINT "competition_stages_stage_kind_id_domain_values_id_fk" FOREIGN KEY ("stage_kind_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_stages" ADD CONSTRAINT "competition_stages_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_stat_snapshots" ADD CONSTRAINT "competitor_stat_snapshots_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_stat_snapshots" ADD CONSTRAINT "competitor_stat_snapshots_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_stat_snapshots" ADD CONSTRAINT "competitor_stat_snapshots_period_id_domain_values_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_stat_snapshots" ADD CONSTRAINT "competitor_stat_snapshots_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_participations" ADD CONSTRAINT "contest_participations_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_participations" ADD CONSTRAINT "contest_participations_entry_id_competition_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_participations" ADD CONSTRAINT "contest_participations_person_id_competitors_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_participations" ADD CONSTRAINT "contest_participations_role_id_domain_values_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_sides" ADD CONSTRAINT "contest_sides_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_sides" ADD CONSTRAINT "contest_sides_entry_id_competition_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_sides" ADD CONSTRAINT "contest_sides_outcome_id_domain_values_id_fk" FOREIGN KEY ("outcome_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_event_id_competition_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."competition_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_stage_id_competition_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_members" ADD CONSTRAINT "entry_members_entry_id_competition_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_members" ADD CONSTRAINT "entry_members_person_id_competitors_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_members" ADD CONSTRAINT "entry_members_role_id_domain_values_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_members" ADD CONSTRAINT "entry_members_registration_status_id_domain_values_id_fk" FOREIGN KEY ("registration_status_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_members" ADD CONSTRAINT "entry_members_appearance_id_domain_values_id_fk" FOREIGN KEY ("appearance_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_members" ADD CONSTRAINT "entry_members_position_id_domain_values_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_metrics" ADD CONSTRAINT "result_metrics_result_id_competition_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."competition_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_metrics" ADD CONSTRAINT "result_metrics_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "classifications_edition_id_label_index" ON "classifications" USING btree ("edition_id","label") WHERE "classifications"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_entries_edition_id_event_id_competitor_id_index" ON "competition_entries" USING btree ("edition_id","event_id","competitor_id") WHERE "competition_entries"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competition_entries_competitor_id_index" ON "competition_entries" USING btree ("competitor_id") WHERE "competition_entries"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_events_edition_id_label_index" ON "competition_events" USING btree ("edition_id","label") WHERE "competition_events"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competition_events_sport_id_index" ON "competition_events" USING btree ("sport_id") WHERE "competition_events"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_results_scope_scope_id_entry_id_index" ON "competition_results" USING btree ("scope","scope_id","entry_id") WHERE "competition_results"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competition_results_entry_id_index" ON "competition_results" USING btree ("entry_id") WHERE "competition_results"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_stages_edition_id_label_index" ON "competition_stages" USING btree ("edition_id","label") WHERE "competition_stages"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competitor_stat_snapshots_competitor_id_sport_id_period_label_metric_id_index" ON "competitor_stat_snapshots" USING btree ("competitor_id","sport_id","period_label","metric_id") WHERE "competitor_stat_snapshots"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "contest_participations_contest_id_person_id_index" ON "contest_participations" USING btree ("contest_id","person_id") WHERE "contest_participations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "contest_sides_contest_id_entry_id_index" ON "contest_sides" USING btree ("contest_id","entry_id") WHERE "contest_sides"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "contests_event_id_label_index" ON "contests" USING btree ("event_id","label") WHERE "contests"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "entry_members_entry_id_person_id_index" ON "entry_members" USING btree ("entry_id","person_id") WHERE "entry_members"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "entry_members_person_id_index" ON "entry_members" USING btree ("person_id") WHERE "entry_members"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "result_metrics_result_id_metric_id_index" ON "result_metrics" USING btree ("result_id","metric_id") WHERE "result_metrics"."deleted_at" is null;--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "competition_events" FOR EACH ROW EXECUTE FUNCTION register_entity('competition_event')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'competition_event', 'system:registry' FROM "competition_events" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "competition_events" ADD CONSTRAINT "competition_events_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_scope_values" CHECK (scope IN ('event', 'contest', 'classification'))--> statement-breakpoint
ALTER TABLE "entry_members" ADD CONSTRAINT "entry_members_verification_values" CHECK (verification IN ('verified', 'provisional', 'disputed', 'rejected'))--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_extension_needs_schema" CHECK (extension IS NULL OR extension_schema_id IS NOT NULL)--> statement-breakpoint
SELECT protect_all_tables()
