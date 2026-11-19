ALTER TABLE "competitions" ALTER COLUMN "sport_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_sport_unless_multisport" CHECK (sport_id IS NOT NULL OR is_multi_sport)--> statement-breakpoint
SELECT protect_all_tables()
