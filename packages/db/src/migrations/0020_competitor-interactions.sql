-- T3.1 (D02/D03): exclusive star + unlimited hearts per account, and the public counters view.
CREATE TABLE "competitor_hearts" (
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
	"competitor_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor_stars" (
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
	"competitor_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitor_hearts" ADD CONSTRAINT "competitor_hearts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_hearts" ADD CONSTRAINT "competitor_hearts_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_stars" ADD CONSTRAINT "competitor_stars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_stars" ADD CONSTRAINT "competitor_stars_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "competitor_hearts_user_id_competitor_id_index" ON "competitor_hearts" USING btree ("user_id","competitor_id") WHERE "competitor_hearts"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competitor_hearts_competitor_id_index" ON "competitor_hearts" USING btree ("competitor_id") WHERE "competitor_hearts"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competitor_stars_user_id_index" ON "competitor_stars" USING btree ("user_id") WHERE "competitor_stars"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competitor_stars_competitor_id_index" ON "competitor_stars" USING btree ("competitor_id") WHERE "competitor_stars"."deleted_at" is null;--> statement-breakpoint
CREATE VIEW "public"."competitor_interaction_counts" AS (select competitor_id, sum(stars)::int as stars_count, sum(hearts)::int as hearts_count from (
    select competitor_id, 1 as stars, 0 as hearts from competitor_stars where deleted_at is null
    union all
    select competitor_id, 0 as stars, 1 as hearts from competitor_hearts where deleted_at is null
  ) as interactions group by competitor_id);--> statement-breakpoint
SELECT protect_all_tables();
