CREATE TABLE "category_dimension_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"dimension_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_dimensions" (
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
	"value_type" "dimension_value_type" NOT NULL,
	"unit_kind" text
);
--> statement-breakpoint
CREATE TABLE "category_mappings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"from_value_id" uuid NOT NULL,
	"to_value_id" uuid NOT NULL,
	"relation_id" uuid NOT NULL,
	"context_organization_id" uuid,
	"valid_from_year" integer,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "category_set_values" (
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
	"value_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_sets" (
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
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_value_translations" (
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
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"dimension_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"original_label" text NOT NULL,
	"original_locale" text,
	"min" real,
	"max" real,
	"unit" text,
	"normalized_min" real,
	"normalized_max" real,
	"organization_id" uuid,
	"valid_from_year" integer,
	"valid_to_year" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communities" (
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
	"kind_id" uuid NOT NULL,
	"country_id" uuid,
	"parent_id" uuid
);
--> statement-breakpoint
CREATE TABLE "community_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"community_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "competition_program_sports" (
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
	"sport_id" uuid NOT NULL,
	"inclusion_status_id" uuid NOT NULL,
	"first_year" integer,
	"last_year" integer,
	"editions" integer[] DEFAULT '{}' NOT NULL,
	"note" text,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "competition_ruleset_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"ruleset_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_rulesets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" text NOT NULL,
	"slug" text NOT NULL,
	"sport_id" uuid,
	"organization_id" uuid,
	"competition_id" uuid,
	"valid_from_year" integer,
	"valid_to_year" integer,
	"document_source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "competitor_representations" (
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
	"representation_id" uuid NOT NULL,
	"context_id" uuid NOT NULL,
	"is_primary" integer DEFAULT 0 NOT NULL,
	"from_year" integer,
	"to_year" integer,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "extension_schemas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"key" text NOT NULL,
	"sport_id" uuid,
	"json_schema" jsonb NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "metric_definition_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"metric_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metric_definitions" (
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
	"value_type" "metric_value_type" NOT NULL,
	"unit" text,
	"better" "metric_direction" DEFAULT 'none' NOT NULL,
	"sport_id" uuid
);
--> statement-breakpoint
CREATE TABLE "organization_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"organization_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"from_year" integer,
	"to_year" integer,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "sport_classifications" (
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
	"scheme_id" uuid NOT NULL,
	"value_id" uuid NOT NULL,
	"organization_id" uuid,
	"since_year" integer,
	"source_link_id" uuid
);
--> statement-breakpoint
CREATE TABLE "sport_relations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_via" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"from_sport_id" uuid NOT NULL,
	"to_sport_id" uuid NOT NULL,
	"relation_id" uuid NOT NULL,
	"source_link_id" uuid
);
--> statement-breakpoint
ALTER TABLE "category_dimension_translations" ADD CONSTRAINT "category_dimension_translations_dimension_id_category_dimensions_id_fk" FOREIGN KEY ("dimension_id") REFERENCES "public"."category_dimensions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_dimensions" ADD CONSTRAINT "category_dimensions_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_from_value_id_category_values_id_fk" FOREIGN KEY ("from_value_id") REFERENCES "public"."category_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_to_value_id_category_values_id_fk" FOREIGN KEY ("to_value_id") REFERENCES "public"."category_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_relation_id_domain_values_id_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_context_organization_id_organizations_id_fk" FOREIGN KEY ("context_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_set_values" ADD CONSTRAINT "category_set_values_set_id_category_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."category_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_set_values" ADD CONSTRAINT "category_set_values_value_id_category_values_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."category_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_value_translations" ADD CONSTRAINT "category_value_translations_value_id_category_values_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."category_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_values" ADD CONSTRAINT "category_values_dimension_id_category_dimensions_id_fk" FOREIGN KEY ("dimension_id") REFERENCES "public"."category_dimensions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_values" ADD CONSTRAINT "category_values_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_kind_id_domain_values_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_parent_id_communities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_translations" ADD CONSTRAINT "community_translations_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_program_sports" ADD CONSTRAINT "competition_program_sports_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_program_sports" ADD CONSTRAINT "competition_program_sports_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_program_sports" ADD CONSTRAINT "competition_program_sports_inclusion_status_id_domain_values_id_fk" FOREIGN KEY ("inclusion_status_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_ruleset_translations" ADD CONSTRAINT "competition_ruleset_translations_ruleset_id_competition_rulesets_id_fk" FOREIGN KEY ("ruleset_id") REFERENCES "public"."competition_rulesets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_rulesets" ADD CONSTRAINT "competition_rulesets_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_rulesets" ADD CONSTRAINT "competition_rulesets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_rulesets" ADD CONSTRAINT "competition_rulesets_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_representations" ADD CONSTRAINT "competitor_representations_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_representations" ADD CONSTRAINT "competitor_representations_representation_id_entity_registry_id_fk" FOREIGN KEY ("representation_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_representations" ADD CONSTRAINT "competitor_representations_context_id_domain_values_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_schemas" ADD CONSTRAINT "extension_schemas_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_definition_translations" ADD CONSTRAINT "metric_definition_translations_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_definitions" ADD CONSTRAINT "metric_definitions_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_roles" ADD CONSTRAINT "organization_roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_roles" ADD CONSTRAINT "organization_roles_target_id_entity_registry_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."entity_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_roles" ADD CONSTRAINT "organization_roles_role_id_domain_values_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_classifications" ADD CONSTRAINT "sport_classifications_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_classifications" ADD CONSTRAINT "sport_classifications_scheme_id_domain_values_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_classifications" ADD CONSTRAINT "sport_classifications_value_id_domain_values_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_classifications" ADD CONSTRAINT "sport_classifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_relations" ADD CONSTRAINT "sport_relations_from_sport_id_sports_id_fk" FOREIGN KEY ("from_sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_relations" ADD CONSTRAINT "sport_relations_to_sport_id_sports_id_fk" FOREIGN KEY ("to_sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_relations" ADD CONSTRAINT "sport_relations_relation_id_domain_values_id_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."domain_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_dimension_translations_dimension_id_locale_index" ON "category_dimension_translations" USING btree ("dimension_id","locale") WHERE "category_dimension_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_dimensions_global_uq" ON "category_dimensions" USING btree ("slug") WHERE "category_dimensions"."deleted_at" is null and "category_dimensions"."sport_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_dimensions_sport_uq" ON "category_dimensions" USING btree ("slug","sport_id") WHERE "category_dimensions"."deleted_at" is null and "category_dimensions"."sport_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_mappings_from_value_id_to_value_id_relation_id_index" ON "category_mappings" USING btree ("from_value_id","to_value_id","relation_id") WHERE "category_mappings"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_set_values_set_id_value_id_index" ON "category_set_values" USING btree ("set_id","value_id") WHERE "category_set_values"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_sets_slug_index" ON "category_sets" USING btree ("slug") WHERE "category_sets"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_value_translations_value_id_locale_index" ON "category_value_translations" USING btree ("value_id","locale") WHERE "category_value_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_values_global_uq" ON "category_values" USING btree ("dimension_id","slug") WHERE "category_values"."deleted_at" is null and "category_values"."organization_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "category_values_org_uq" ON "category_values" USING btree ("dimension_id","slug","organization_id") WHERE "category_values"."deleted_at" is null and "category_values"."organization_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "communities_slug_index" ON "communities" USING btree ("slug") WHERE "communities"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "community_translations_community_id_locale_index" ON "community_translations" USING btree ("community_id","locale") WHERE "community_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_program_sports_competition_id_sport_id_inclusion_status_id_index" ON "competition_program_sports" USING btree ("competition_id","sport_id","inclusion_status_id") WHERE "competition_program_sports"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competition_program_sports_sport_id_index" ON "competition_program_sports" USING btree ("sport_id") WHERE "competition_program_sports"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_ruleset_translations_ruleset_id_locale_index" ON "competition_ruleset_translations" USING btree ("ruleset_id","locale") WHERE "competition_ruleset_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_rulesets_slug_index" ON "competition_rulesets" USING btree ("slug") WHERE "competition_rulesets"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "competitor_representations_competitor_id_representation_id_context_id_index" ON "competitor_representations" USING btree ("competitor_id","representation_id","context_id") WHERE "competitor_representations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "competitor_representations_representation_id_index" ON "competitor_representations" USING btree ("representation_id") WHERE "competitor_representations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "extension_schemas_key_index" ON "extension_schemas" USING btree ("key") WHERE "extension_schemas"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "metric_definition_translations_metric_id_locale_index" ON "metric_definition_translations" USING btree ("metric_id","locale") WHERE "metric_definition_translations"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "metric_definitions_slug_index" ON "metric_definitions" USING btree ("slug") WHERE "metric_definitions"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_roles_organization_id_target_id_role_id_index" ON "organization_roles" USING btree ("organization_id","target_id","role_id") WHERE "organization_roles"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "organization_roles_target_id_index" ON "organization_roles" USING btree ("target_id") WHERE "organization_roles"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_classifications_sport_id_scheme_id_value_id_index" ON "sport_classifications" USING btree ("sport_id","scheme_id","value_id") WHERE "sport_classifications"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "sport_relations_from_sport_id_to_sport_id_relation_id_index" ON "sport_relations" USING btree ("from_sport_id","to_sport_id","relation_id") WHERE "sport_relations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "sport_relations_to_sport_id_index" ON "sport_relations" USING btree ("to_sport_id") WHERE "sport_relations"."deleted_at" is null;--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "communities" FOR EACH ROW EXECUTE FUNCTION register_entity('representation_entity')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'representation_entity', 'system:registry' FROM "communities" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
CREATE TRIGGER register_entity AFTER INSERT ON "competition_rulesets" FOR EACH ROW EXECUTE FUNCTION register_entity('ruleset')--> statement-breakpoint
INSERT INTO entity_registry (id, entity_type, created_via) SELECT id, 'ruleset', 'system:registry' FROM "competition_rulesets" ON CONFLICT (id) DO NOTHING--> statement-breakpoint
ALTER TABLE "competition_rulesets" ADD CONSTRAINT "competition_rulesets_registry_fk" FOREIGN KEY (id) REFERENCES entity_registry(id) DEFERRABLE INITIALLY DEFERRED--> statement-breakpoint
ALTER TABLE "competition_editions" ADD CONSTRAINT "competition_editions_ruleset_fk" FOREIGN KEY (ruleset_id) REFERENCES competition_rulesets(id)--> statement-breakpoint
ALTER TABLE "sport_relations" ADD CONSTRAINT "sport_relations_no_self" CHECK (from_sport_id <> to_sport_id)--> statement-breakpoint
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_no_self" CHECK (from_value_id <> to_value_id)--> statement-breakpoint
SELECT protect_all_tables()
