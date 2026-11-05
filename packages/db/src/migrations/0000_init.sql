CREATE TYPE "public"."athlete_status" AS ENUM('active', 'retired', 'deceased');--> statement-breakpoint
CREATE TYPE "public"."banned_word_match_mode" AS ENUM('word', 'contains');--> statement-breakpoint
CREATE TYPE "public"."comment_reaction" AS ENUM('like', 'dislike');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('visible', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."competition_level" AS ENUM('world', 'continental', 'national', 'local');--> statement-breakpoint
CREATE TYPE "public"."competition_status" AS ENUM('scheduled', 'ongoing', 'finished');--> statement-breakpoint
CREATE TYPE "public"."consent_purpose" AS ENUM('notification_emails', 'analytics_cookies', 'ad_cookies');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('new', 'answered', 'closed');--> statement-breakpoint
CREATE TYPE "public"."contact_topic" AS ENUM('data_error', 'press', 'privacy', 'partnership', 'other');--> statement-breakpoint
CREATE TYPE "public"."dossier_status" AS ENUM('draft', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."governance_model" AS ENUM('pyramid', 'condominium', 'free_market', 'publisher', 'cultural');--> statement-breakpoint
CREATE TYPE "public"."ingestion_run_status" AS ENUM('running', 'success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."legal_document_kind" AS ENUM('privacy', 'terms', 'cookies');--> statement-breakpoint
CREATE TYPE "public"."milestone_kind" AS ENUM('birth', 'death', 'title', 'record', 'career');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('comment_reply', 'suggestion_reviewed');--> statement-breakpoint
CREATE TYPE "public"."observance_recognition" AS ENUM('un_resolution', 'federation', 'tradition');--> statement-breakpoint
CREATE TYPE "public"."observance_scope" AS ENUM('world', 'national');--> statement-breakpoint
CREATE TYPE "public"."org_nature" AS ENUM('association', 'company', 'brand', 'media', 'community', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."org_relation" AS ENUM('member_of', 'recognized_by', 'licensed_by', 'owned_by', 'affiliated_to');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_status" AS ENUM('open', 'in_progress', 'answered', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."privacy_right" AS ENUM('access', 'correction', 'deletion', 'portability', 'opposition', 'revoke');--> statement-breakpoint
CREATE TYPE "public"."privacy_subject_kind" AS ENUM('user', 'athlete', 'heir', 'other');--> statement-breakpoint
CREATE TYPE "public"."source_origin_kind" AS ENUM('community', 'historians', 'official', 'proprietary', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."source_usage_status" AS ENUM('active', 'pending_permission', 'link_only', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'approved', 'rejected', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('mythic', 'legendary', 'elite', 'champion');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('reader', 'admin');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"team_id" uuid,
	"sport_id" uuid,
	"sport_category_id" uuid,
	"achievement_type_id" uuid NOT NULL,
	"competition_edition_id" uuid,
	"award_edition_id" uuid,
	"calendar_day_id" uuid,
	"year" integer NOT NULL,
	"rank" integer,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "athlete_milestone_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"milestone_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_milestones" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"calendar_day_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"date" date NOT NULL,
	"kind" "milestone_kind" NOT NULL,
	"achievement_id" uuid,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "athlete_nationalities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_sports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"primary_category_id" uuid,
	"position" text,
	"from_year" integer,
	"to_year" integer
);
--> statement-breakpoint
CREATE TABLE "athlete_stats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"sport_id" uuid,
	"period" text DEFAULT 'career' NOT NULL,
	"stats_schema_key" text NOT NULL,
	"stats" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_teams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"from_date" date,
	"to_date" date,
	"from_year" integer,
	"to_year" integer,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "athlete_tier_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"from_tier_id" uuid NOT NULL,
	"to_tier_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"decided_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"short_bio" text
);
--> statement-breakpoint
CREATE TABLE "athletes" (
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
	"wikidata_qid" text,
	"full_name" text,
	"known_as" text NOT NULL,
	"nicknames" text[] DEFAULT '{}' NOT NULL,
	"gender" text,
	"birth_calendar_day_id" uuid,
	"birth_year" integer,
	"birth_date" date,
	"birth_city_id" uuid,
	"death_calendar_day_id" uuid,
	"death_year" integer,
	"death_date" date,
	"death_city_id" uuid,
	"height_cm" integer,
	"dominant_hand" text,
	"dominant_foot" text,
	"career_start_year" integer,
	"career_end_year" integer,
	"status" "athlete_status" NOT NULL,
	"photo_media_link_id" uuid,
	"champion_tier_id" uuid NOT NULL,
	"legacy_score" real,
	"legacy_percentile" real DEFAULT 0 NOT NULL,
	"external_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"inclusion_reason" text,
	"locked_fields" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_reigns" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"won_calendar_day_id" uuid,
	"won_year" integer,
	"won_date" date NOT NULL,
	"lost_calendar_day_id" uuid,
	"lost_year" integer,
	"lost_date" date,
	"end_reason" text,
	"defenses" integer,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "award_editions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"award_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"calendar_day_id" uuid,
	"label" text
);
--> statement-breakpoint
CREATE TABLE "award_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"award_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "awards" (
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
	"sport_id" uuid,
	"organization_id" uuid,
	"competition_level_id" uuid NOT NULL,
	"award_kind" text NOT NULL,
	"prize_form_id" uuid
);
--> statement-breakpoint
CREATE TABLE "competition_editions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"competition_id" uuid NOT NULL,
	"edition_number" integer,
	"year" integer NOT NULL,
	"start_calendar_day_id" uuid,
	"start_year" integer,
	"end_calendar_day_id" uuid,
	"end_year" integer,
	"start_date" date,
	"end_date" date,
	"status" "competition_status" DEFAULT 'finished' NOT NULL,
	"host_country_id" uuid,
	"host_city_id" uuid,
	"label" text,
	"is_example" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"competition_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
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
	"sport_id" uuid NOT NULL,
	"sport_category_id" uuid,
	"organization_id" uuid NOT NULL,
	"competition_level_id" uuid NOT NULL,
	"is_olympic" boolean DEFAULT false NOT NULL,
	"scope_country_id" uuid,
	"periodicity" text,
	"prize_form_id" uuid,
	"wikidata_qid" text
);
--> statement-breakpoint
CREATE TABLE "teams" (
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
	"sport_id" uuid,
	"country_id" uuid,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"wikidata_qid" text
);
--> statement-breakpoint
CREATE TABLE "achievement_types" (
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
	"rank_weight" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "champion_tiers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"slug" "tier" NOT NULL,
	"sort_order" integer NOT NULL,
	"min_percentile" integer,
	"requires_dossier" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_levels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"slug" "competition_level" NOT NULL,
	"weight" real NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_model_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"governance_model_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_models" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"slug" "governance_model" NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_kind_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"organization_kind_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_kinds" (
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
	"nature" "org_nature" NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prize_form_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"prize_form_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prize_forms" (
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
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_days" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"month" integer NOT NULL,
	"day" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"country_id" uuid,
	"region" text,
	"wikidata_qid" text
);
--> statement-breakpoint
CREATE TABLE "city_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"city_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"iso2" text NOT NULL,
	"iso3" text,
	"iso_numeric" text,
	"flag_emoji" text NOT NULL,
	"wikidata_qid" text
);
--> statement-breakpoint
CREATE TABLE "country_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"country_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "greats_dossier_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"dossier_id" uuid NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "greats_dossier_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"dossier_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"headline" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "greats_dossiers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"status" "dossier_status" DEFAULT 'draft' NOT NULL,
	"approvals_required" integer DEFAULT 2 NOT NULL,
	"approvals_count" integer DEFAULT 0 NOT NULL,
	"review_note" text
);
--> statement-breakpoint
CREATE TABLE "greats_evidence_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"evidence_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "greats_evidences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"dossier_id" uuid NOT NULL,
	"evidence_type" text NOT NULL,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "ai_collection_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"mode" text NOT NULL,
	"checked" integer DEFAULT 0 NOT NULL,
	"unchanged" integer DEFAULT 0 NOT NULL,
	"validated" integer DEFAULT 0 NOT NULL,
	"facts_accepted" integer DEFAULT 0 NOT NULL,
	"facts_rejected" integer DEFAULT 0 NOT NULL,
	"extractor_tokens" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_logs" (
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
	"source_link_id" uuid,
	"level" text NOT NULL,
	"action" text,
	"message" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"job_key" text NOT NULL,
	"source_id" uuid,
	"mode" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "ingestion_run_status" NOT NULL,
	"checked" integer DEFAULT 0 NOT NULL,
	"unchanged" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"skipped" jsonb,
	"tokens" integer DEFAULT 0 NOT NULL,
	"parser_version" text
);
--> statement-breakpoint
CREATE TABLE "observance_day_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"observance_day_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observance_days" (
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
	"calendar_day_id" uuid NOT NULL,
	"scope" "observance_scope" NOT NULL,
	"country_id" uuid,
	"sport_id" uuid,
	"recognition" "observance_recognition" NOT NULL,
	"reference" text
);
--> statement-breakpoint
CREATE TABLE "organizations" (
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
	"organization_kind_id" uuid NOT NULL,
	"parent_organization_id" uuid,
	"parent_relation" "org_relation",
	"scope_level_id" uuid NOT NULL,
	"country_id" uuid,
	"wikidata_qid" text,
	"website" text,
	"wikipedia_url" text,
	"image_url" text,
	"short_description" text
);
--> statement-breakpoint
CREATE TABLE "athlete_suggestions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_name" text NOT NULL,
	"sport_id" uuid,
	"sport_other" text,
	"urls" text[] NOT NULL,
	"justification" text,
	"contact_email" text,
	"user_id" uuid,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"existing_athlete_id" uuid,
	"protocol" text NOT NULL,
	"ip_hash" text
);
--> statement-breakpoint
CREATE TABLE "banned_words" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"term" text NOT NULL,
	"match_mode" "banned_word_match_mode" NOT NULL,
	"locale" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_reactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" "comment_reaction" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"athlete_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"body" text NOT NULL,
	"status" "comment_status" DEFAULT 'visible' NOT NULL,
	"hidden_reason" text,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"dislikes_count" integer DEFAULT 0 NOT NULL,
	"replies_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"topic" "contact_topic" NOT NULL,
	"body" text NOT NULL,
	"user_id" uuid,
	"status" "contact_status" DEFAULT 'new' NOT NULL,
	"protocol" text NOT NULL,
	"ip_hash" text
);
--> statement-breakpoint
CREATE TABLE "tier_votes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"champion_tier_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_extraction_queue" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"source_link_id" uuid NOT NULL,
	"revision" text,
	"section_key" text NOT NULL,
	"section_hash" text NOT NULL,
	"diff_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"skipped_at_gate" text,
	"result_json" jsonb,
	"model" text,
	"prompt_version" text,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "field_conflicts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"field_name" text NOT NULL,
	"chosen_source_link_id" uuid,
	"other_source_link_id" uuid,
	"base_value" text,
	"chosen_value" text NOT NULL,
	"other_value" text NOT NULL,
	"resolution" text DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "field_provenance" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"field_name" text NOT NULL,
	"source_link_id" uuid,
	"ref" text,
	"retrieved_at" date,
	"extraction_method" text DEFAULT 'parser' NOT NULL,
	"model" text,
	"evidence_quote" text
);
--> statement-breakpoint
CREATE TABLE "media_links" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"url" text NOT NULL,
	"thumb_url" text,
	"file_page_url" text,
	"kind" text DEFAULT 'photo' NOT NULL,
	"author" text,
	"license" text,
	"year" integer,
	"status" text DEFAULT 'ok' NOT NULL,
	"last_verified_at" date,
	"source_id" uuid
);
--> statement-breakpoint
CREATE TABLE "source_links" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"url" text NOT NULL,
	"source_id" uuid,
	"parser_key" text,
	"origin" text DEFAULT 'system' NOT NULL,
	"suggestion_id" uuid,
	"pending_label" text,
	"pending_sport" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_revision" text,
	"last_section_hashes" jsonb,
	"last_checked_at" date,
	"last_status" text
);
--> statement-breakpoint
CREATE TABLE "sources" (
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
	"base_url" text NOT NULL,
	"license" text DEFAULT '' NOT NULL,
	"origin_kind" "source_origin_kind" NOT NULL,
	"commercial_use" text NOT NULL,
	"usage_status" "source_usage_status" NOT NULL,
	"usage_note" text,
	"license_reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sport_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"sport_id" uuid NOT NULL,
	"parent_category_id" uuid,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_category_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"category_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_collection_reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"sport_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"facts" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_governing_bodies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"sport_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_group_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"group_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_groups" (
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
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_subgroup_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"subgroup_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_subgroups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"group_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"sport_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rules_summary" text,
	"pinnacle" text
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"subgroup_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"wikipedia_url" text,
	"wikidata_qid" text,
	"is_team_sport" boolean DEFAULT false NOT NULL,
	"stats_schema_key" text NOT NULL,
	"color_token" text NOT NULL,
	"governance_model_id" uuid,
	"environment" text NOT NULL,
	"format" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"actor_id" uuid,
	"actor_type" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"entity_version" integer,
	"ip_hash" text,
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" jsonb,
	"diff" jsonb,
	"summary" text,
	"author" text,
	"reason" text,
	"change_request_id" uuid,
	"ingestion_run_id" uuid
);
--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"document_kind" "legal_document_kind" NOT NULL,
	"document_version" text NOT NULL,
	"accepted_at" timestamp with time zone NOT NULL,
	"ip_hash" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"actor_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"emailed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "privacy_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"protocol" text NOT NULL,
	"requester_email" text NOT NULL,
	"user_id" uuid,
	"subject_kind" "privacy_subject_kind" NOT NULL,
	"right" "privacy_right" NOT NULL,
	"athlete_id" uuid,
	"details" text NOT NULL,
	"status" "privacy_request_status" DEFAULT 'open' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"answered_at" timestamp with time zone,
	"handled_by" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" "consent_purpose" NOT NULL,
	"granted" boolean NOT NULL,
	"decided_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'reader' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"locale" text DEFAULT 'pt-BR' NOT NULL,
	"banned_at" timestamp with time zone,
	"ban_reason" text,
	"tier_votes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_sport_category_id_sport_categories_id_fk" FOREIGN KEY ("sport_category_id") REFERENCES "public"."sport_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_achievement_type_id_achievement_types_id_fk" FOREIGN KEY ("achievement_type_id") REFERENCES "public"."achievement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_competition_edition_id_competition_editions_id_fk" FOREIGN KEY ("competition_edition_id") REFERENCES "public"."competition_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_award_edition_id_award_editions_id_fk" FOREIGN KEY ("award_edition_id") REFERENCES "public"."award_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_source_link_id_source_links_id_fk" FOREIGN KEY ("source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_milestone_translations" ADD CONSTRAINT "athlete_milestone_translations_milestone_id_athlete_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."athlete_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_milestones" ADD CONSTRAINT "athlete_milestones_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_milestones" ADD CONSTRAINT "athlete_milestones_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_milestones" ADD CONSTRAINT "athlete_milestones_source_link_id_source_links_id_fk" FOREIGN KEY ("source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_nationalities" ADD CONSTRAINT "athlete_nationalities_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_nationalities" ADD CONSTRAINT "athlete_nationalities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_sports" ADD CONSTRAINT "athlete_sports_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_sports" ADD CONSTRAINT "athlete_sports_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_sports" ADD CONSTRAINT "athlete_sports_primary_category_id_sport_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."sport_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_stats" ADD CONSTRAINT "athlete_stats_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_stats" ADD CONSTRAINT "athlete_stats_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_teams" ADD CONSTRAINT "athlete_teams_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_teams" ADD CONSTRAINT "athlete_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_tier_history" ADD CONSTRAINT "athlete_tier_history_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_tier_history" ADD CONSTRAINT "athlete_tier_history_from_tier_id_champion_tiers_id_fk" FOREIGN KEY ("from_tier_id") REFERENCES "public"."champion_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_tier_history" ADD CONSTRAINT "athlete_tier_history_to_tier_id_champion_tiers_id_fk" FOREIGN KEY ("to_tier_id") REFERENCES "public"."champion_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_translations" ADD CONSTRAINT "athlete_translations_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_birth_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("birth_calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_birth_city_id_cities_id_fk" FOREIGN KEY ("birth_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_death_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("death_calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_death_city_id_cities_id_fk" FOREIGN KEY ("death_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_photo_media_link_id_media_links_id_fk" FOREIGN KEY ("photo_media_link_id") REFERENCES "public"."media_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_champion_tier_id_champion_tiers_id_fk" FOREIGN KEY ("champion_tier_id") REFERENCES "public"."champion_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_reigns" ADD CONSTRAINT "title_reigns_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_reigns" ADD CONSTRAINT "title_reigns_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_reigns" ADD CONSTRAINT "title_reigns_won_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("won_calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_reigns" ADD CONSTRAINT "title_reigns_lost_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("lost_calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_reigns" ADD CONSTRAINT "title_reigns_source_link_id_source_links_id_fk" FOREIGN KEY ("source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_editions" ADD CONSTRAINT "award_editions_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_editions" ADD CONSTRAINT "award_editions_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_translations" ADD CONSTRAINT "award_translations_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_competition_level_id_competition_levels_id_fk" FOREIGN KEY ("competition_level_id") REFERENCES "public"."competition_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_prize_form_id_prize_forms_id_fk" FOREIGN KEY ("prize_form_id") REFERENCES "public"."prize_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_editions" ADD CONSTRAINT "competition_editions_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_editions" ADD CONSTRAINT "competition_editions_start_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("start_calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_editions" ADD CONSTRAINT "competition_editions_end_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("end_calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_editions" ADD CONSTRAINT "competition_editions_host_country_id_countries_id_fk" FOREIGN KEY ("host_country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_editions" ADD CONSTRAINT "competition_editions_host_city_id_cities_id_fk" FOREIGN KEY ("host_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_translations" ADD CONSTRAINT "competition_translations_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_sport_category_id_sport_categories_id_fk" FOREIGN KEY ("sport_category_id") REFERENCES "public"."sport_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_competition_level_id_competition_levels_id_fk" FOREIGN KEY ("competition_level_id") REFERENCES "public"."competition_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_scope_country_id_countries_id_fk" FOREIGN KEY ("scope_country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_prize_form_id_prize_forms_id_fk" FOREIGN KEY ("prize_form_id") REFERENCES "public"."prize_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_model_translations" ADD CONSTRAINT "governance_model_translations_governance_model_id_governance_models_id_fk" FOREIGN KEY ("governance_model_id") REFERENCES "public"."governance_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_kind_translations" ADD CONSTRAINT "organization_kind_translations_organization_kind_id_organization_kinds_id_fk" FOREIGN KEY ("organization_kind_id") REFERENCES "public"."organization_kinds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prize_form_translations" ADD CONSTRAINT "prize_form_translations_prize_form_id_prize_forms_id_fk" FOREIGN KEY ("prize_form_id") REFERENCES "public"."prize_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city_translations" ADD CONSTRAINT "city_translations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_translations" ADD CONSTRAINT "country_translations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greats_dossier_approvals" ADD CONSTRAINT "greats_dossier_approvals_dossier_id_greats_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."greats_dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greats_dossier_approvals" ADD CONSTRAINT "greats_dossier_approvals_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greats_dossier_translations" ADD CONSTRAINT "greats_dossier_translations_dossier_id_greats_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."greats_dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greats_dossiers" ADD CONSTRAINT "greats_dossiers_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greats_evidence_translations" ADD CONSTRAINT "greats_evidence_translations_evidence_id_greats_evidences_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."greats_evidences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greats_evidences" ADD CONSTRAINT "greats_evidences_dossier_id_greats_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."greats_dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greats_evidences" ADD CONSTRAINT "greats_evidences_source_link_id_source_links_id_fk" FOREIGN KEY ("source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_logs" ADD CONSTRAINT "ingestion_logs_run_id_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ingestion_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_logs" ADD CONSTRAINT "ingestion_logs_source_link_id_source_links_id_fk" FOREIGN KEY ("source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observance_day_translations" ADD CONSTRAINT "observance_day_translations_observance_day_id_observance_days_id_fk" FOREIGN KEY ("observance_day_id") REFERENCES "public"."observance_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observance_days" ADD CONSTRAINT "observance_days_calendar_day_id_calendar_days_id_fk" FOREIGN KEY ("calendar_day_id") REFERENCES "public"."calendar_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observance_days" ADD CONSTRAINT "observance_days_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observance_days" ADD CONSTRAINT "observance_days_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_organization_kind_id_organization_kinds_id_fk" FOREIGN KEY ("organization_kind_id") REFERENCES "public"."organization_kinds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_organization_id_organizations_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_scope_level_id_competition_levels_id_fk" FOREIGN KEY ("scope_level_id") REFERENCES "public"."competition_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_suggestions" ADD CONSTRAINT "athlete_suggestions_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_suggestions" ADD CONSTRAINT "athlete_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_suggestions" ADD CONSTRAINT "athlete_suggestions_existing_athlete_id_athletes_id_fk" FOREIGN KEY ("existing_athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_votes" ADD CONSTRAINT "tier_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_votes" ADD CONSTRAINT "tier_votes_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_votes" ADD CONSTRAINT "tier_votes_champion_tier_id_champion_tiers_id_fk" FOREIGN KEY ("champion_tier_id") REFERENCES "public"."champion_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_extraction_queue" ADD CONSTRAINT "ai_extraction_queue_source_link_id_source_links_id_fk" FOREIGN KEY ("source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_conflicts" ADD CONSTRAINT "field_conflicts_chosen_source_link_id_source_links_id_fk" FOREIGN KEY ("chosen_source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_conflicts" ADD CONSTRAINT "field_conflicts_other_source_link_id_source_links_id_fk" FOREIGN KEY ("other_source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_source_link_id_source_links_id_fk" FOREIGN KEY ("source_link_id") REFERENCES "public"."source_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_links" ADD CONSTRAINT "source_links_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_categories" ADD CONSTRAINT "sport_categories_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_categories" ADD CONSTRAINT "sport_categories_parent_category_id_sport_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "public"."sport_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_category_translations" ADD CONSTRAINT "sport_category_translations_category_id_sport_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."sport_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_collection_reports" ADD CONSTRAINT "sport_collection_reports_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_governing_bodies" ADD CONSTRAINT "sport_governing_bodies_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_governing_bodies" ADD CONSTRAINT "sport_governing_bodies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_group_translations" ADD CONSTRAINT "sport_group_translations_group_id_sport_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."sport_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_subgroup_translations" ADD CONSTRAINT "sport_subgroup_translations_subgroup_id_sport_subgroups_id_fk" FOREIGN KEY ("subgroup_id") REFERENCES "public"."sport_subgroups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_subgroups" ADD CONSTRAINT "sport_subgroups_group_id_sport_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."sport_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_translations" ADD CONSTRAINT "sport_translations_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports" ADD CONSTRAINT "sports_subgroup_id_sport_subgroups_id_fk" FOREIGN KEY ("subgroup_id") REFERENCES "public"."sport_subgroups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports" ADD CONSTRAINT "sports_governance_model_id_governance_models_id_fk" FOREIGN KEY ("governance_model_id") REFERENCES "public"."governance_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_athlete_id_year_index" ON "achievements" USING btree ("athlete_id","year") WHERE "achievements"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "achievements_calendar_day_id_index" ON "achievements" USING btree ("calendar_day_id") WHERE "achievements"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_milestone_translations_milestone_id_locale_index" ON "athlete_milestone_translations" USING btree ("milestone_id","locale") WHERE "athlete_milestone_translations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "athlete_milestones_calendar_day_id_index" ON "athlete_milestones" USING btree ("calendar_day_id") WHERE "athlete_milestones"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "athlete_nationalities_country_id_index" ON "athlete_nationalities" USING btree ("country_id") WHERE "athlete_nationalities"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "athlete_sports_sport_id_index" ON "athlete_sports" USING btree ("sport_id") WHERE "athlete_sports"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_translations_athlete_id_locale_index" ON "athlete_translations" USING btree ("athlete_id","locale") WHERE "athlete_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "athletes_slug_index" ON "athletes" USING btree ("slug") WHERE "athletes"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "athletes_wikidata_qid_index" ON "athletes" USING btree ("wikidata_qid") WHERE "athletes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "athletes_birth_calendar_day_id_index" ON "athletes" USING btree ("birth_calendar_day_id") WHERE "athletes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "athletes_death_calendar_day_id_index" ON "athletes" USING btree ("death_calendar_day_id") WHERE "athletes"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "award_translations_award_id_locale_index" ON "award_translations" USING btree ("award_id","locale") WHERE "award_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "awards_slug_index" ON "awards" USING btree ("slug") WHERE "awards"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competition_editions_start_date_end_date_index" ON "competition_editions" USING btree ("start_date","end_date") WHERE "competition_editions"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_translations_competition_id_locale_index" ON "competition_translations" USING btree ("competition_id","locale") WHERE "competition_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competitions_slug_index" ON "competitions" USING btree ("slug") WHERE "competitions"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_index" ON "teams" USING btree ("slug") WHERE "teams"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "achievement_types_slug_index" ON "achievement_types" USING btree ("slug") WHERE "achievement_types"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "champion_tiers_slug_index" ON "champion_tiers" USING btree ("slug") WHERE "champion_tiers"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_levels_slug_index" ON "competition_levels" USING btree ("slug") WHERE "competition_levels"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "governance_model_translations_governance_model_id_locale_index" ON "governance_model_translations" USING btree ("governance_model_id","locale") WHERE "governance_model_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "governance_models_slug_index" ON "governance_models" USING btree ("slug") WHERE "governance_models"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_kind_translations_organization_kind_id_locale_index" ON "organization_kind_translations" USING btree ("organization_kind_id","locale") WHERE "organization_kind_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_kinds_slug_index" ON "organization_kinds" USING btree ("slug") WHERE "organization_kinds"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "prize_form_translations_prize_form_id_locale_index" ON "prize_form_translations" USING btree ("prize_form_id","locale") WHERE "prize_form_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "prize_forms_slug_index" ON "prize_forms" USING btree ("slug") WHERE "prize_forms"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_days_month_day_index" ON "calendar_days" USING btree ("month","day") WHERE "calendar_days"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "city_translations_city_id_locale_index" ON "city_translations" USING btree ("city_id","locale") WHERE "city_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "countries_iso2_index" ON "countries" USING btree ("iso2") WHERE "countries"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "country_translations_country_id_locale_index" ON "country_translations" USING btree ("country_id","locale") WHERE "country_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "greats_dossier_approvals_dossier_id_admin_user_id_index" ON "greats_dossier_approvals" USING btree ("dossier_id","admin_user_id") WHERE "greats_dossier_approvals"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "greats_dossier_translations_dossier_id_locale_index" ON "greats_dossier_translations" USING btree ("dossier_id","locale") WHERE "greats_dossier_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "greats_dossiers_athlete_id_index" ON "greats_dossiers" USING btree ("athlete_id") WHERE "greats_dossiers"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "greats_evidence_translations_evidence_id_locale_index" ON "greats_evidence_translations" USING btree ("evidence_id","locale") WHERE "greats_evidence_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "observance_day_translations_observance_day_id_locale_index" ON "observance_day_translations" USING btree ("observance_day_id","locale") WHERE "observance_day_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "observance_days_slug_index" ON "observance_days" USING btree ("slug") WHERE "observance_days"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_index" ON "organizations" USING btree ("slug") WHERE "organizations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "banned_words_term_locale_index" ON "banned_words" USING btree ("term","locale") WHERE "banned_words"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "comment_reactions_comment_id_user_id_index" ON "comment_reactions" USING btree ("comment_id","user_id") WHERE "comment_reactions"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "comments_athlete_id_index" ON "comments" USING btree ("athlete_id") WHERE "comments"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "comments_user_id_index" ON "comments" USING btree ("user_id") WHERE "comments"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "tier_votes_user_id_athlete_id_index" ON "tier_votes" USING btree ("user_id","athlete_id") WHERE "tier_votes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "tier_votes_athlete_id_index" ON "tier_votes" USING btree ("athlete_id") WHERE "tier_votes"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_extraction_queue_source_link_id_section_hash_index" ON "ai_extraction_queue" USING btree ("source_link_id","section_hash") WHERE "ai_extraction_queue"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "field_provenance_entity_type_entity_id_index" ON "field_provenance" USING btree ("entity_type","entity_id") WHERE "field_provenance"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "source_links_entity_type_entity_id_index" ON "source_links" USING btree ("entity_type","entity_id") WHERE "source_links"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "source_links_source_id_index" ON "source_links" USING btree ("source_id") WHERE "source_links"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sources_slug_index" ON "sources" USING btree ("slug") WHERE "sources"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_categories_sport_id_slug_index" ON "sport_categories" USING btree ("sport_id","slug") WHERE "sport_categories"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_category_translations_category_id_locale_index" ON "sport_category_translations" USING btree ("category_id","locale") WHERE "sport_category_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_collection_reports_sport_id_index" ON "sport_collection_reports" USING btree ("sport_id") WHERE "sport_collection_reports"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_governing_bodies_sport_id_organization_id_role_index" ON "sport_governing_bodies" USING btree ("sport_id","organization_id","role") WHERE "sport_governing_bodies"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_group_translations_group_id_locale_index" ON "sport_group_translations" USING btree ("group_id","locale") WHERE "sport_group_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_groups_slug_index" ON "sport_groups" USING btree ("slug") WHERE "sport_groups"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_subgroup_translations_subgroup_id_locale_index" ON "sport_subgroup_translations" USING btree ("subgroup_id","locale") WHERE "sport_subgroup_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_subgroups_slug_index" ON "sport_subgroups" USING btree ("slug") WHERE "sport_subgroups"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_translations_sport_id_locale_index" ON "sport_translations" USING btree ("sport_id","locale") WHERE "sport_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sports_slug_index" ON "sports" USING btree ("slug") WHERE "sports"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "audit_logs_action_index" ON "audit_logs" USING btree ("action") WHERE "audit_logs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_entity_id_index" ON "audit_logs" USING btree ("entity_type","entity_id") WHERE "audit_logs"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "entity_versions_entity_type_entity_id_version_number_index" ON "entity_versions" USING btree ("entity_type","entity_id","version_number") WHERE "entity_versions"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "legal_acceptances_user_id_document_kind_document_version_index" ON "legal_acceptances" USING btree ("user_id","document_kind","document_version") WHERE "legal_acceptances"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "notifications_user_id_index" ON "notifications" USING btree ("user_id") WHERE "notifications"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "user_consents_user_id_purpose_index" ON "user_consents" USING btree ("user_id","purpose") WHERE "user_consents"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_index" ON "users" USING btree ("email") WHERE "users"."deleted_at" is null;