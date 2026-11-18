CREATE TABLE "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_expires_at_index" ON "rate_limit_buckets" USING btree ("expires_at");--> statement-breakpoint
-- Hand-edited: ephemeral counters, physically deleted by the cleanup job (expired windows).
INSERT INTO "forbid_delete_exempt" ("table_name", "reason") VALUES
	('rate_limit_buckets', 'Rate-limit counters: expired windows deleted by the cleanup job');--> statement-breakpoint
SELECT protect_all_tables();
