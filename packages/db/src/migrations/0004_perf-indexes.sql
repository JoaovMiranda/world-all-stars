DROP INDEX "comments_athlete_id_index";--> statement-breakpoint
DROP INDEX "comments_user_id_index";--> statement-breakpoint
DROP INDEX "notifications_user_id_index";--> statement-breakpoint
CREATE INDEX "ingestion_logs_run_id_at_index" ON "ingestion_logs" USING btree ("run_id","at") WHERE "ingestion_logs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ingestion_runs_started_at_index" ON "ingestion_runs" USING btree ("started_at") WHERE "ingestion_runs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ingestion_runs_job_key_started_at_index" ON "ingestion_runs" USING btree ("job_key","started_at") WHERE "ingestion_runs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "athlete_suggestions_created_at_index" ON "athlete_suggestions" USING btree ("created_at") WHERE "athlete_suggestions"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "banned_words_lower_term_idx" ON "banned_words" USING btree (lower("term"),"locale") WHERE "banned_words"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "comments_athlete_id_status_created_at_index" ON "comments" USING btree ("athlete_id","status","created_at") WHERE "comments"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "comments_user_id_created_at_index" ON "comments" USING btree ("user_id","created_at") WHERE "comments"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "contact_messages_created_at_index" ON "contact_messages" USING btree ("created_at") WHERE "contact_messages"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ai_extraction_queue_created_at_index" ON "ai_extraction_queue" USING btree ("created_at") WHERE "ai_extraction_queue"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "source_links_queued_idx" ON "source_links" USING btree ("created_at") WHERE "source_links"."deleted_at" is null and "source_links"."entity_id" is null;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_index" ON "audit_logs" USING btree ("created_at") WHERE "audit_logs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_at_index" ON "notifications" USING btree ("user_id","created_at") WHERE "notifications"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "privacy_requests_created_at_index" ON "privacy_requests" USING btree ("created_at") WHERE "privacy_requests"."deleted_at" is null;