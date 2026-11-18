ALTER TYPE "public"."legal_document_kind" ADD VALUE 'age_declaration';--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_provider_id_account_id_index" ON "auth_accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_index" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_index" ON "auth_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_index" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_index" ON "auth_verifications" USING btree ("identifier");--> statement-breakpoint
-- Hand-edited: Better Auth's boolean mirrors the audit-friendly instant (kept in sync by its database hooks).
UPDATE "users" SET "email_verified" = true WHERE "email_verified_at" IS NOT NULL;--> statement-breakpoint
-- Ephemeral tables that MAY be physically deleted (Better Auth: sign-out, expiry, account deletion). Everything
-- else stays soft delete only. protect_all_tables() skips the tables listed here.
CREATE TABLE "forbid_delete_exempt" (
	"table_name" text PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "forbid_delete_exempt" ("table_name", "reason") VALUES
	('auth_sessions', 'Better Auth sessions: deleted on sign-out, expiry and account deletion'),
	('auth_accounts', 'Better Auth OAuth links: deleted on account deletion'),
	('auth_verifications', 'Better Auth short-lived tokens: deleted when used or expired');--> statement-breakpoint
CREATE OR REPLACE FUNCTION protect_all_tables() RETURNS void LANGUAGE plpgsql AS $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND NOT EXISTS (SELECT 1 FROM pg_trigger g WHERE g.tgrelid = c.oid AND g.tgname = 'forbid_delete')
      AND NOT EXISTS (SELECT 1 FROM forbid_delete_exempt e WHERE e.table_name = c.relname)
  LOOP
    EXECUTE format('CREATE TRIGGER forbid_delete BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION forbid_delete()', t.relname);
  END LOOP;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS forbid_delete ON "auth_sessions";--> statement-breakpoint
DROP TRIGGER IF EXISTS forbid_delete ON "auth_accounts";--> statement-breakpoint
DROP TRIGGER IF EXISTS forbid_delete ON "auth_verifications";--> statement-breakpoint
SELECT protect_all_tables();
