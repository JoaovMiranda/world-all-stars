CREATE TABLE "recognition_cycles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"definition_id" uuid NOT NULL,
	"year" integer,
	"label" text NOT NULL,
	"calendar_day_id" uuid
);
--> statement-breakpoint
CREATE TABLE "recognition_definition_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"definition_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"criteria" text
);
--> statement-breakpoint
CREATE TABLE "recognition_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"slug" text NOT NULL,
	"kind_id" uuid NOT NULL,
	"issuer_org_id" uuid,
	"sport_id" uuid,
	"competition_id" uuid,
	"category_set_id" uuid,
	"metric_id" uuid
);
--> statement-breakpoint
CREATE TABLE "recognition_grants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"definition_id" uuid NOT NULL,
	"cycle_id" uuid,
	"competitor_id" uuid NOT NULL,
	"via_competitor_id" uuid,
	"result_id" uuid,
	"level_id" uuid,
	"rank" integer,
	"year" integer,
	"date" date,
	"calendar_day_id" uuid,
	"shared" boolean DEFAULT false NOT NULL,
	"status_id" uuid NOT NULL,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "record_marks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"definition_id" uuid NOT NULL,
	"competitor_id" uuid NOT NULL,
	"value_numeric" real,
	"value_original" text NOT NULL,
	"unit_original" text,
	"date" date,
	"city_id" uuid,
	"conditions" text,
	"ratification_status_id" uuid NOT NULL,
	"ratified_by_org_id" uuid,
	"superseded_by_id" uuid,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "title_defenses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"holding_id" uuid NOT NULL,
	"contest_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_holdings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"definition_id" uuid NOT NULL,
	"competitor_id" uuid NOT NULL,
	"won_contest_id" uuid,
	"from_date" date NOT NULL,
	"from_year" integer,
	"from_calendar_day_id" uuid,
	"to_date" date,
	"to_year" integer,
	"to_calendar_day_id" uuid,
	"end_reason_id" uuid,
	"defenses" integer,
	"source_link_id" uuid
);
--> statement-breakpoint
ALTER TABLE "recognition_cycles" ADD CONSTRAINT "recognition_cycles_definition_id_recognition_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."recognition_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_cycles" ADD CONSTRAINT "recognition_cycles_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_definition_translations" ADD CONSTRAINT "recognition_definition_translations_definition_id_recognition_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."recognition_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_kind_id_domain_values_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_issuer_org_id_organizations_id_fk" FOREIGN KEY ("issuer_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_category_set_id_category_sets_id_fk" FOREIGN KEY ("category_set_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_definition_id_recognition_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."recognition_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_cycle_id_recognition_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."recognition_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_via_competitor_id_competitors_id_fk" FOREIGN KEY ("via_competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_result_id_competition_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."competition_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_level_id_domain_values_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_status_id_domain_values_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_marks" ADD CONSTRAINT "record_marks_definition_id_recognition_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."recognition_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_marks" ADD CONSTRAINT "record_marks_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_marks" ADD CONSTRAINT "record_marks_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_marks" ADD CONSTRAINT "record_marks_ratification_status_id_domain_values_id_fk" FOREIGN KEY ("ratification_status_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_marks" ADD CONSTRAINT "record_marks_ratified_by_org_id_organizations_id_fk" FOREIGN KEY ("ratified_by_org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_defenses" ADD CONSTRAINT "title_defenses_holding_id_title_holdings_id_fk" FOREIGN KEY ("holding_id") REFERENCES "public"."title_holdings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_defenses" ADD CONSTRAINT "title_defenses_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_holdings" ADD CONSTRAINT "title_holdings_definition_id_recognition_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."recognition_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_holdings" ADD CONSTRAINT "title_holdings_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_holdings" ADD CONSTRAINT "title_holdings_won_contest_id_contests_id_fk" FOREIGN KEY ("won_contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_holdings" ADD CONSTRAINT "title_holdings_from_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("from_calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_holdings" ADD CONSTRAINT "title_holdings_to_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("to_calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_holdings" ADD CONSTRAINT "title_holdings_end_reason_id_domain_values_id_fk" FOREIGN KEY ("end_reason_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recognition_cycles_definition_id_label_index" ON "recognition_cycles" USING btree ("definition_id","label") WHERE "recognition_cycles"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "recognition_definition_translations_definition_id_locale_index" ON "recognition_definition_translations" USING btree ("definition_id","locale") WHERE "recognition_definition_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "recognition_definitions_slug_index" ON "recognition_definitions" USING btree ("slug") WHERE "recognition_definitions"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "recognition_definitions_competition_id_index" ON "recognition_definitions" USING btree ("competition_id") WHERE "recognition_definitions"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "recognition_grants_definition_id_competitor_id_index" ON "recognition_grants" USING btree ("definition_id","competitor_id") WHERE "recognition_grants"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "recognition_grants_competitor_id_year_index" ON "recognition_grants" USING btree ("competitor_id","year") WHERE "recognition_grants"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "recognition_grants_calendar_day_id_index" ON "recognition_grants" USING btree ("calendar_day_id") WHERE "recognition_grants"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "record_marks_definition_id_index" ON "record_marks" USING btree ("definition_id") WHERE "record_marks"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "title_defenses_holding_id_contest_id_index" ON "title_defenses" USING btree ("holding_id","contest_id") WHERE "title_defenses"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "title_holdings_competitor_id_index" ON "title_holdings" USING btree ("competitor_id") WHERE "title_holdings"."deleted_at" is null;--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "recognition_definitions" FOR EACH ROW EXECUTE FUNCTION register_entity('recognition_definition')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'recognition_definition', 'system:registry' FROM "recognition_definitions" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
SELECT protect_all_tables()
