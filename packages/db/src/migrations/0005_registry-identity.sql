CREATE TYPE "public"."ai_invocation_status" AS ENUM('ok', 'error', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."competitor_kind" AS ENUM('person', 'team', 'group');--> statement-breakpoint
CREATE TYPE "public"."content_section_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."country_kind" AS ENUM('sovereign', 'historical', 'constituent', 'territory');--> statement-breakpoint
CREATE TYPE "public"."crawl_policy" AS ENUM('allowed', 'api_only', 'link_only', 'forbidden');--> statement-breakpoint
CREATE TYPE "public"."dimension_value_type" AS ENUM('ordinal', 'numeric_range', 'label');--> statement-breakpoint
CREATE TYPE "public"."domain_kind" AS ENUM('taxon_level', 'sport_relation', 'classification_scheme', 'edition_kind', 'stage_kind', 'competition_format', 'entry_composition', 'participation_role', 'membership_role', 'organization_role', 'sport_position', 'entry_status', 'appearance', 'result_status', 'contest_outcome', 'classification_kind', 'recognition_kind', 'grant_status', 'title_end_reason', 'ratification_status', 'inclusion_status', 'name_kind', 'representation_context', 'community_kind', 'entity_relation', 'certainty', 'evidence_type', 'group_kind', 'category_relation', 'recognition_level', 'stat_period');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('competitor', 'organization', 'sport', 'competition', 'competition_edition', 'competition_event', 'recognition_definition', 'representation_entity', 'ruleset');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."information_kind" AS ENUM('identity', 'name', 'biography', 'birth', 'representation', 'sport_taxonomy', 'sport_rules', 'ruleset', 'competition_structure', 'entry', 'participation', 'lineup', 'result', 'classification', 'recognition', 'record', 'title_holding', 'organization', 'category', 'image', 'external_id', 'sport_content');--> statement-breakpoint
CREATE TYPE "public"."job_item_status" AS ENUM('pending', 'running', 'done', 'failed', 'dead', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."metric_direction" AS ENUM('lower', 'higher', 'none');--> statement-breakpoint
CREATE TYPE "public"."metric_value_type" AS ENUM('duration', 'distance', 'mass', 'points', 'count', 'rating', 'score', 'text', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."profile_visibility" AS ENUM('public', 'unlisted', 'none');--> statement-breakpoint
CREATE TYPE "public"."provenance_review_status" AS ENUM('auto_accepted', 'pending', 'approved', 'rejected', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."ranking_output_kind" AS ENUM('score', 'ordinal', 'rating', 'bands');--> statement-breakpoint
CREATE TYPE "public"."ranking_snapshot_status" AS ENUM('draft', 'calculated', 'published', 'archived', 'failed');--> statement-breakpoint
CREATE TYPE "public"."retention_policy" AS ENUM('metadata_only', 'evidence_excerpts', 'full_payload');--> statement-breakpoint
CREATE TABLE "domain_value_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"value_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "domain_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"domain" "domain_kind" NOT NULL,
	"slug" text NOT NULL,
	"sport_id" uuid,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor_groups" (
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
	"name" text NOT NULL,
	"group_kind_id" uuid,
	"formed_for_event_id" uuid,
	"valid_from" date,
	"valid_to" date
);
--> statement-breakpoint
CREATE TABLE "competitor_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"member_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"role_id" uuid,
	"from_date" date,
	"to_date" date,
	"from_year" integer,
	"to_year" integer,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"kind" "competitor_kind" NOT NULL,
	"profile_visibility" "profile_visibility" DEFAULT 'public' NOT NULL,
	"visibility_reason" text,
	"merged_into_id" uuid
);
--> statement-breakpoint
CREATE TABLE "entity_aliases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_id" uuid NOT NULL,
	"name" text NOT NULL,
	"normalized" text NOT NULL,
	"kind_id" uuid NOT NULL,
	"locale" text,
	"script" text,
	"valid_from_year" integer,
	"valid_to_year" integer,
	"source_observation_id" uuid
);
--> statement-breakpoint
CREATE TABLE "entity_external_ids" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"url" text,
	"is_current" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_merges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"survivor_id" uuid NOT NULL,
	"merged_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"actor_id" uuid,
	"affected" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"merged_at" timestamp with time zone NOT NULL,
	"undone_at" timestamp with time zone,
	"undone_by" uuid,
	"undo_reason" text
);
--> statement-breakpoint
CREATE TABLE "entity_registry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_type" "entity_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_relations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"relation_id" uuid NOT NULL,
	"valid_from_year" integer,
	"valid_to_year" integer,
	"note" text,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "slug_redirects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_slug" text NOT NULL,
	"scope" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competition_editions" ALTER COLUMN "year" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ALTER COLUMN "iso2" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ALTER COLUMN "flag_emoji" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competition_editions" ADD COLUMN "edition_kind_id" uuid;--> statement-breakpoint
ALTER TABLE "competition_editions" ADD COLUMN "ruleset_id" uuid;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "format_id" uuid;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "is_multi_sport" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "kind" "country_kind" DEFAULT 'sovereign' NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "ioc_code" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "fifa_code" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "valid_from_year" integer;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "valid_to_year" integer;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "flag_media_link_id" uuid;--> statement-breakpoint
ALTER TABLE "sports" ADD COLUMN "taxon_level_id" uuid;--> statement-breakpoint
ALTER TABLE "domain_value_translations" ADD CONSTRAINT "domain_value_translations_value_id_domain_values_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_values" ADD CONSTRAINT "domain_values_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_values" ADD CONSTRAINT "domain_values_parent_id_domain_values_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_groups" ADD CONSTRAINT "competitor_groups_group_kind_id_domain_values_id_fk" FOREIGN KEY ("group_kind_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_memberships" ADD CONSTRAINT "competitor_memberships_member_id_competitors_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_memberships" ADD CONSTRAINT "competitor_memberships_parent_id_competitors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_memberships" ADD CONSTRAINT "competitor_memberships_role_id_domain_values_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_aliases" ADD CONSTRAINT "entity_aliases_entity_id_entity_registry_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_aliases" ADD CONSTRAINT "entity_aliases_kind_id_domain_values_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_external_ids" ADD CONSTRAINT "entity_external_ids_entity_id_entity_registry_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_merges" ADD CONSTRAINT "entity_merges_survivor_id_entity_registry_id_fk" FOREIGN KEY ("survivor_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_merges" ADD CONSTRAINT "entity_merges_merged_id_entity_registry_id_fk" FOREIGN KEY ("merged_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_from_id_entity_registry_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_to_id_entity_registry_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_relation_id_domain_values_id_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_entity_id_entity_registry_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "domain_value_translations_value_id_locale_index" ON "domain_value_translations" USING btree ("value_id","locale") WHERE "domain_value_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "domain_values_global_uq" ON "domain_values" USING btree ("domain","slug") WHERE "domain_values"."deleted_at" is null and "domain_values"."sport_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "domain_values_sport_uq" ON "domain_values" USING btree ("domain","slug","sport_id") WHERE "domain_values"."deleted_at" is null and "domain_values"."sport_id" is not null;--> statement-breakpoint
CREATE INDEX "domain_values_domain_index" ON "domain_values" USING btree ("domain") WHERE "domain_values"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competitor_groups_slug_index" ON "competitor_groups" USING btree ("slug") WHERE "competitor_groups"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competitor_memberships_member_id_index" ON "competitor_memberships" USING btree ("member_id") WHERE "competitor_memberships"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competitor_memberships_parent_id_index" ON "competitor_memberships" USING btree ("parent_id") WHERE "competitor_memberships"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competitors_kind_index" ON "competitors" USING btree ("kind") WHERE "competitors"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "entity_aliases_entity_id_normalized_kind_id_index" ON "entity_aliases" USING btree ("entity_id","normalized","kind_id") WHERE "entity_aliases"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "entity_aliases_normalized_index" ON "entity_aliases" USING btree ("normalized") WHERE "entity_aliases"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "entity_external_ids_provider_external_id_index" ON "entity_external_ids" USING btree ("provider","external_id") WHERE "entity_external_ids"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "entity_external_ids_entity_id_index" ON "entity_external_ids" USING btree ("entity_id") WHERE "entity_external_ids"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "entity_registry_entity_type_index" ON "entity_registry" USING btree ("entity_type") WHERE "entity_registry"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "entity_relations_from_id_to_id_relation_id_index" ON "entity_relations" USING btree ("from_id","to_id","relation_id") WHERE "entity_relations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "entity_relations_to_id_index" ON "entity_relations" USING btree ("to_id") WHERE "entity_relations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "slug_redirects_entity_type_scope_old_slug_index" ON "slug_redirects" USING btree ("entity_type","scope","old_slug") WHERE "slug_redirects"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "countries_code_uq" ON "countries" USING btree ("code") WHERE "countries"."deleted_at" is null;--> statement-breakpoint
-- Handoff v3 §4.1: every catalog entity has ONE entity_registry row with the SAME id (AFTER INSERT triggers, so an
-- upsert that ends as an UPDATE never leaves orphans; the id FKs are deferred to the end of the transaction).
CREATE OR REPLACE FUNCTION register_entity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO entity_registry (id, entity_type, created_via) VALUES (NEW.id, TG_ARGV[0]::entity_type, 'system:registry') ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$--> statement-breakpoint
-- Competitor subtypes (athletes = person, teams = team, competitor_groups = group): registry + competitors row.
CREATE OR REPLACE FUNCTION register_competitor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO entity_registry (id, entity_type, created_via) VALUES (NEW.id, 'competitor', 'system:registry') ON CONFLICT (id) DO NOTHING;
  INSERT INTO competitors (id, kind, created_via) VALUES (NEW.id, TG_ARGV[0]::competitor_kind, 'system:registry') ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_competitor AFTER INSERT ON "athletes" FOR EACH ROW EXECUTE FUNCTION register_competitor('person')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'competitor', 'system:registry' FROM "athletes" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
INSERT INTO competitors (id, kind, created_via) SELECT id, 'person', 'system:registry' FROM "athletes" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_competitor_fk" FOREIGN KEY (id) REFERENCES competitors(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_competitor AFTER INSERT ON "teams" FOR EACH ROW EXECUTE FUNCTION register_competitor('team')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'competitor', 'system:registry' FROM "teams" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
INSERT INTO competitors (id, kind, created_via) SELECT id, 'team', 'system:registry' FROM "teams" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_competitor_fk" FOREIGN KEY (id) REFERENCES competitors(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_competitor AFTER INSERT ON "competitor_groups" FOR EACH ROW EXECUTE FUNCTION register_competitor('group')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'competitor', 'system:registry' FROM "competitor_groups" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
INSERT INTO competitors (id, kind, created_via) SELECT id, 'group', 'system:registry' FROM "competitor_groups" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "competitor_groups" ADD CONSTRAINT "competitor_groups_competitor_fk" FOREIGN KEY (id) REFERENCES competitors(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "organizations" FOR EACH ROW EXECUTE FUNCTION register_entity('organization')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'organization', 'system:registry' FROM "organizations" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "sports" FOR EACH ROW EXECUTE FUNCTION register_entity('sport')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'sport', 'system:registry' FROM "sports" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "sports" ADD CONSTRAINT "sports_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "competitions" FOR EACH ROW EXECUTE FUNCTION register_entity('competition')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'competition', 'system:registry' FROM "competitions" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "competition_editions" FOR EACH ROW EXECUTE FUNCTION register_entity('competition_edition')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'competition_edition', 'system:registry' FROM "competition_editions" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "competition_editions" ADD CONSTRAINT "competition_editions_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "countries" FOR EACH ROW EXECUTE FUNCTION register_entity('representation_entity')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'representation_entity', 'system:registry' FROM "countries" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
ALTER TABLE "competitor_memberships" ADD CONSTRAINT "competitor_memberships_no_self" CHECK (member_id <> parent_id)--> statement-breakpoint
-- C05: only sovereign states need ISO 3166 codes; historical/constituent entities are kept as they were.
UPDATE countries SET code = lower(iso2) WHERE code IS NULL AND iso2 IS NOT NULL--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_iso2_when_sovereign" CHECK (kind <> 'sovereign' OR iso2 IS NOT NULL)--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_code_required" CHECK (code IS NOT NULL OR iso2 IS NOT NULL)--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_gender_values" CHECK (gender IS NULL OR gender IN ('male', 'female', 'unknown'))--> statement-breakpoint
ALTER TABLE "sports" ADD CONSTRAINT "sports_taxon_level_fk" FOREIGN KEY (taxon_level_id) REFERENCES domain_values(id)--> statement-breakpoint
ALTER TABLE "competition_editions" ADD CONSTRAINT "competition_editions_edition_kind_fk" FOREIGN KEY (edition_kind_id) REFERENCES domain_values(id)--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_format_fk" FOREIGN KEY (format_id) REFERENCES domain_values(id)--> statement-breakpoint
SELECT protect_all_tables()
