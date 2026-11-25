-- T1.2 (final): the last legacy tables and athletes.wikidata_qid. Every reader/writer now uses the universal model
-- (competitor_memberships, competitor_representations, recognition_*, title_holdings, competitor_stat_*, entity_external_ids).
ALTER TABLE "achievements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "athlete_nationalities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "athlete_stats" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "athlete_teams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "title_reigns" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "achievements" CASCADE;--> statement-breakpoint
DROP TABLE "athlete_nationalities" CASCADE;--> statement-breakpoint
DROP TABLE "athlete_stats" CASCADE;--> statement-breakpoint
DROP TABLE "athlete_teams" CASCADE;--> statement-breakpoint
DROP TABLE "title_reigns" CASCADE;--> statement-breakpoint
DROP INDEX "athletes_wikidata_qid_index";--> statement-breakpoint
ALTER TABLE "athletes" DROP COLUMN "wikidata_qid";--> statement-breakpoint
SELECT protect_all_tables();
