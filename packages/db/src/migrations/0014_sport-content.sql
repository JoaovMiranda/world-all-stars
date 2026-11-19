CREATE TABLE "sport_content_section_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"section_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sport_content_sections" (
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
	"section_key" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"media_link_id" uuid,
	"status" "content_section_status" DEFAULT 'draft' NOT NULL,
	"certainty_id" uuid
);
--> statement-breakpoint
ALTER TABLE "sport_content_section_translations" ADD CONSTRAINT "sport_content_section_translations_section_id_sport_content_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sport_content_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_content_sections" ADD CONSTRAINT "sport_content_sections_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_content_sections" ADD CONSTRAINT "sport_content_sections_media_link_id_media_links_id_fk" FOREIGN KEY ("media_link_id") REFERENCES "public"."media_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_content_sections" ADD CONSTRAINT "sport_content_sections_certainty_id_domain_values_id_fk" FOREIGN KEY ("certainty_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_content_section_translations_section_id_locale_index" ON "sport_content_section_translations" USING btree ("section_id","locale") WHERE "sport_content_section_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_content_sections_sport_id_section_key_index" ON "sport_content_sections" USING btree ("sport_id","section_key") WHERE "sport_content_sections"."deleted_at" is null;--> statement-breakpoint
SELECT protect_all_tables()
