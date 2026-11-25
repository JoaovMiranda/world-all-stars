-- T3.2: accounts flagged by the tier-vote anomaly rule, kept out of the admin tier signals until reviewed.
CREATE TYPE "public"."tier_vote_flag_status" AS ENUM('pending', 'cleared', 'rejected');--> statement-breakpoint
CREATE TABLE "tier_vote_flags" (
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
	"burst_votes" integer NOT NULL,
	"status" "tier_vote_flag_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text
);
--> statement-breakpoint
ALTER TABLE "tier_vote_flags" ADD CONSTRAINT "tier_vote_flags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_vote_flags" ADD CONSTRAINT "tier_vote_flags_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier_vote_flags" ADD CONSTRAINT "tier_vote_flags_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tier_vote_flags_user_id_index" ON "tier_vote_flags" USING btree ("user_id") WHERE "tier_vote_flags"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "tier_vote_flags_status_index" ON "tier_vote_flags" USING btree ("status") WHERE "tier_vote_flags"."deleted_at" is null;--> statement-breakpoint
SELECT protect_all_tables();
