CREATE TABLE "identity_candidates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"observation_id" uuid NOT NULL,
	"discovered_name" text NOT NULL,
	"proposed_entity_id" uuid,
	"confidence" real NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "licenses" (
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
	"url" text,
	"requires_attribution" integer DEFAULT 1 NOT NULL,
	"share_alike" integer DEFAULT 0 NOT NULL,
	"commercial_use" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_authorities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"source_id" uuid NOT NULL,
	"information_kind" "information_kind" NOT NULL,
	"sport_id" uuid,
	"organization_id" uuid,
	"competition_id" uuid,
	"category_set_id" uuid,
	"metric_id" uuid,
	"recognition_kind_id" uuid,
	"jurisdiction_entity_id" uuid,
	"evidence_type_id" uuid,
	"valid_from_year" integer,
	"valid_to_year" integer,
	"priority" integer DEFAULT 100 NOT NULL,
	"justification" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"source_id" uuid NOT NULL,
	"url" text NOT NULL,
	"canonical_url" text NOT NULL,
	"revision_id" text,
	"fetched_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"http_status" integer NOT NULL,
	"content_type" text,
	"charset" text,
	"raw_hash" text NOT NULL,
	"normalized_hash" text NOT NULL,
	"payload_id" uuid,
	"license_id" uuid,
	"job_id" uuid
);
--> statement-breakpoint
CREATE TABLE "source_observations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"document_id" uuid NOT NULL,
	"provider_key" text NOT NULL,
	"parser_key" text NOT NULL,
	"parser_version" text NOT NULL,
	"record_key" text NOT NULL,
	"information_kind" "information_kind" NOT NULL,
	"contract" text NOT NULL,
	"extracted" jsonb NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"entity_id" uuid
);
--> statement-breakpoint
CREATE TABLE "source_payloads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"normalized_hash" text NOT NULL,
	"content_type" text NOT NULL,
	"body" text,
	"body_kind" text DEFAULT 'none' NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "observation_id" uuid;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "confidence" real;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "review_status" "provenance_review_status" DEFAULT 'auto_accepted' NOT NULL;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "sot_rule_id" uuid;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "is_current" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "field_provenance" ADD COLUMN "certainty_id" uuid;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "crawl_policy" "crawl_policy" DEFAULT 'link_only' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "retention_policy" "retention_policy" DEFAULT 'metadata_only' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "robots_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "terms_url" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "terms_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "allowed_hosts" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "min_interval_ms" integer DEFAULT 3000 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "license_id" uuid;--> statement-breakpoint
ALTER TABLE "identity_candidates" ADD CONSTRAINT "identity_candidates_observation_id_source_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."source_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_candidates" ADD CONSTRAINT "identity_candidates_proposed_entity_id_entity_registry_id_fk" FOREIGN KEY ("proposed_entity_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_category_set_id_category_sets_id_fk" FOREIGN KEY ("category_set_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_recognition_kind_id_domain_values_id_fk" FOREIGN KEY ("recognition_kind_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_jurisdiction_entity_id_entity_registry_id_fk" FOREIGN KEY ("jurisdiction_entity_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_authorities" ADD CONSTRAINT "source_authorities_evidence_type_id_domain_values_id_fk" FOREIGN KEY ("evidence_type_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_payload_id_source_payloads_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."source_payloads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_observations" ADD CONSTRAINT "source_observations_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_observations" ADD CONSTRAINT "source_observations_entity_id_entity_registry_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "identity_candidates_observation_id_index" ON "identity_candidates" USING btree ("observation_id") WHERE "identity_candidates"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "identity_candidates_status_index" ON "identity_candidates" USING btree ("status") WHERE "identity_candidates"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "licenses_slug_index" ON "licenses" USING btree ("slug") WHERE "licenses"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "source_authorities_information_kind_index" ON "source_authorities" USING btree ("information_kind") WHERE "source_authorities"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "source_documents_canonical_url_revision_id_normalized_hash_index" ON "source_documents" USING btree ("canonical_url","revision_id","normalized_hash") WHERE "source_documents"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "source_documents_source_id_index" ON "source_documents" USING btree ("source_id") WHERE "source_documents"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "source_observations_document_id_parser_key_parser_version_record_key_index" ON "source_observations" USING btree ("document_id","parser_key","parser_version","record_key") WHERE "source_observations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "source_observations_entity_id_index" ON "source_observations" USING btree ("entity_id") WHERE "source_observations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "source_payloads_normalized_hash_index" ON "source_payloads" USING btree ("normalized_hash") WHERE "source_payloads"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_license_fk" FOREIGN KEY (license_id) REFERENCES licenses(id)--> statement-breakpoint
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_license_fk" FOREIGN KEY (license_id) REFERENCES licenses(id)--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_observation_fk" FOREIGN KEY (observation_id) REFERENCES source_observations(id)--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_document_fk" FOREIGN KEY (document_id) REFERENCES source_documents(id)--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_sot_rule_fk" FOREIGN KEY (sot_rule_id) REFERENCES source_authorities(id)--> statement-breakpoint
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_certainty_fk" FOREIGN KEY (certainty_id) REFERENCES domain_values(id)--> statement-breakpoint
-- G03: a system actor never approves; approved values carry a human approver.
ALTER TABLE "field_provenance" ADD CONSTRAINT "field_provenance_approved_by_human" CHECK (review_status <> 'approved' OR approved_by IS NOT NULL)--> statement-breakpoint
ALTER TABLE "identity_candidates" ADD CONSTRAINT "identity_candidates_status_values" CHECK (status IN ('pending', 'matched', 'created', 'duplicate', 'rejected'))--> statement-breakpoint
SELECT protect_all_tables()
