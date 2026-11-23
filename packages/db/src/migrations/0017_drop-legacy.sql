-- Drop the retired legacy model, step 1 (handoff T1.2). The catalog reads only the universal model (T1.1); the parity
-- gate (packages/db/src/cli/legacy-parity.cli.ts → data/review/legacy-diff.md) reported 0 missing before this ran.
-- Part 1: columns/tables that make the universal model lossless (division and display class of a grant, award level and
-- prize form, holding end note, membership role label, named category sets, stat documents as registered extensions).
CREATE TABLE "competitor_stat_extensions" (
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
	"period_label" text DEFAULT 'career' NOT NULL,
	"extension_schema_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "category_set_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"set_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD COLUMN "competition_level_id" uuid;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD COLUMN "prize_form_id" uuid;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD COLUMN "category_set_id" uuid;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD COLUMN "achievement_type_id" uuid;--> statement-breakpoint
ALTER TABLE "title_holdings" ADD COLUMN "end_note" text;--> statement-breakpoint
ALTER TABLE "competitor_memberships" ADD COLUMN "role_label" text;--> statement-breakpoint
ALTER TABLE "category_sets" ADD COLUMN "sport_id" uuid;--> statement-breakpoint
ALTER TABLE "category_sets" ADD COLUMN "parent_set_id" uuid;--> statement-breakpoint
ALTER TABLE "category_sets" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "competitor_stat_extensions" ADD CONSTRAINT "competitor_stat_extensions_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_stat_extensions" ADD CONSTRAINT "competitor_stat_extensions_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_stat_extensions" ADD CONSTRAINT "competitor_stat_extensions_extension_schema_id_extension_schemas_id_fk" FOREIGN KEY ("extension_schema_id") REFERENCES "public"."extension_schemas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_set_translations" ADD CONSTRAINT "category_set_translations_set_id_category_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "competitor_stat_extensions_competitor_id_period_label_extension_schema_id_index" ON "competitor_stat_extensions" USING btree ("competitor_id","period_label","extension_schema_id") WHERE "competitor_stat_extensions"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_set_translations_set_id_locale_index" ON "category_set_translations" USING btree ("set_id","locale") WHERE "category_set_translations"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_competition_level_id_competition_levels_id_fk" FOREIGN KEY ("competition_level_id") REFERENCES "public"."competition_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_definitions" ADD CONSTRAINT "recognition_definitions_prize_form_id_prize_forms_id_fk" FOREIGN KEY ("prize_form_id") REFERENCES "public"."prize_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_category_set_id_category_sets_id_fk" FOREIGN KEY ("category_set_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recognition_grants" ADD CONSTRAINT "recognition_grants_achievement_type_id_achievement_types_id_fk" FOREIGN KEY ("achievement_type_id") REFERENCES "public"."achievement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_sets" ADD CONSTRAINT "category_sets_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_sets" ADD CONSTRAINT "category_sets_parent_set_id_category_sets_id_fk" FOREIGN KEY ("parent_set_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_sets_sport_id_index" ON "category_sets" USING btree ("sport_id") WHERE "category_sets"."deleted_at" is null;--> statement-breakpoint
-- Part 2: carry the tables dropped below into the universal model on databases seeded before this migration (fresh
-- databases are seeded straight into it). Sport categories → category sets (matched by slug), their names, the
-- category references of athlete_sports / competitions, and the level + prize form of the award definitions.
ALTER TABLE "achievements" DROP CONSTRAINT IF EXISTS "achievements_sport_category_id_sport_categories_id_fk";--> statement-breakpoint
ALTER TABLE "achievements" DROP CONSTRAINT IF EXISTS "achievements_award_edition_id_award_editions_id_fk";--> statement-breakpoint
ALTER TABLE "athlete_sports" DROP CONSTRAINT IF EXISTS "athlete_sports_primary_category_id_sport_categories_id_fk";--> statement-breakpoint
ALTER TABLE "competitions" DROP CONSTRAINT IF EXISTS "competitions_sport_category_id_sport_categories_id_fk";--> statement-breakpoint
INSERT INTO "category_sets" ("id", "created_via", "slug", "label", "sport_id", "sort_order")
SELECT c."id", 'migration', c."slug", c."slug", c."sport_id", c."sort_order" FROM "sport_categories" c
WHERE c."deleted_at" IS NULL AND NOT EXISTS (SELECT 1 FROM "category_sets" s WHERE s."slug" = c."slug" AND s."deleted_at" IS NULL);--> statement-breakpoint
UPDATE "category_sets" s SET "sport_id" = c."sport_id", "sort_order" = c."sort_order"
FROM "sport_categories" c WHERE c."slug" = s."slug" AND c."deleted_at" IS NULL AND s."deleted_at" IS NULL AND s."sport_id" IS NULL;--> statement-breakpoint
UPDATE "category_sets" s SET "parent_set_id" = ps."id"
FROM "sport_categories" c JOIN "sport_categories" pc ON pc."id" = c."parent_category_id" JOIN "category_sets" ps ON ps."slug" = pc."slug" AND ps."deleted_at" IS NULL
WHERE c."slug" = s."slug" AND c."deleted_at" IS NULL AND s."deleted_at" IS NULL AND s."parent_set_id" IS NULL;--> statement-breakpoint
INSERT INTO "category_set_translations" ("id", "created_via", "set_id", "locale", "name")
SELECT gen_random_uuid(), 'migration', s."id", t."locale", t."name"
FROM "sport_category_translations" t JOIN "sport_categories" c ON c."id" = t."category_id" JOIN "category_sets" s ON s."slug" = c."slug" AND s."deleted_at" IS NULL
WHERE t."deleted_at" IS NULL AND NOT EXISTS (SELECT 1 FROM "category_set_translations" x WHERE x."set_id" = s."id" AND x."locale" = t."locale" AND x."deleted_at" IS NULL);--> statement-breakpoint
UPDATE "athlete_sports" a SET "primary_category_id" = s."id"
FROM "sport_categories" c JOIN "category_sets" s ON s."slug" = c."slug" AND s."deleted_at" IS NULL WHERE a."primary_category_id" = c."id";--> statement-breakpoint
UPDATE "competitions" x SET "sport_category_id" = s."id"
FROM "sport_categories" c JOIN "category_sets" s ON s."slug" = c."slug" AND s."deleted_at" IS NULL WHERE x."sport_category_id" = c."id";--> statement-breakpoint
UPDATE "recognition_definitions" d SET "competition_level_id" = a."competition_level_id", "prize_form_id" = a."prize_form_id"
FROM "awards" a WHERE d."slug" = 'award--' || a."slug" AND d."competition_level_id" IS NULL;--> statement-breakpoint
ALTER TABLE "athlete_sports" ADD CONSTRAINT "athlete_sports_primary_category_id_category_sets_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_sport_category_id_category_sets_id_fk" FOREIGN KEY ("sport_category_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Part 3: drop what no module references any more. achievements, title_reigns, athlete_nationalities, athlete_teams,
-- athlete_stats and athletes.wikidata_qid stay (read-only for the catalog) until ingest and admin merge stop using them.
DROP TABLE "award_editions";--> statement-breakpoint
DROP TABLE "award_translations";--> statement-breakpoint
DROP TABLE "awards";--> statement-breakpoint
DROP TABLE "sport_category_translations";--> statement-breakpoint
DROP TABLE "sport_categories";--> statement-breakpoint
ALTER TABLE "athletes" DROP COLUMN "nicknames";--> statement-breakpoint
ALTER TABLE "athletes" DROP COLUMN "external_ids";--> statement-breakpoint
ALTER TABLE "athletes" DROP COLUMN "social_links";--> statement-breakpoint
SELECT protect_all_tables()
