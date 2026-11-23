CREATE TABLE "cross_sport_mappings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"ruleset_key" text NOT NULL,
	"sport" text NOT NULL,
	"kind" text NOT NULL,
	"value" text NOT NULL,
	"band" text NOT NULL,
	"from_year" integer DEFAULT 0 NOT NULL,
	"to_year" integer,
	"source_note" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cross_sport_mappings_ruleset_key_sport_kind_value_from_year_index" ON "cross_sport_mappings" USING btree ("ruleset_key","sport","kind","value","from_year") WHERE "cross_sport_mappings"."deleted_at" is null;
--> statement-breakpoint
SELECT protect_all_tables()
