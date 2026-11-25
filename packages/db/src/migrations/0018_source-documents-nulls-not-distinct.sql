-- Two workers fetching the same URL at once must store ONE document. The unique index on
-- (canonical_url, revision_id, normalized_hash) treated NULL revision ids as distinct, so documents without a
-- revision could be stored twice (found by the T1.9 concurrency suite). Same index, NULLS NOT DISTINCT
-- (Postgres 15+; Drizzle cannot express it on a partial index, so the table definition keeps the plain form).
DROP INDEX IF EXISTS "source_documents_canonical_url_revision_id_normalized_hash_index";--> statement-breakpoint
CREATE UNIQUE INDEX "source_documents_canonical_url_revision_id_normalized_hash_index" ON "source_documents" USING btree ("canonical_url","revision_id","normalized_hash") NULLS NOT DISTINCT WHERE "source_documents"."deleted_at" is null;
