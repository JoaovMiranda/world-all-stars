import type { Database } from '@was/db';
import { sql } from 'drizzle-orm';

/** D05: approval / rejection / tokens / latency per model × task (from ai_invocations + the review outcome). */
export const aiReport = async (db: Database) =>
  (
    (await db.execute(sql`
    select m.provider, m.name model, i.task, count(*)::int calls, sum(i.tokens_in + i.tokens_out)::int tokens, round(avg(i.latency_ms))::int avg_latency_ms,
      sum(i.estimated_cost)::float cost,
      (select count(*)::int from ai_extraction_queue q where q.invocation_id = any(array_agg(i.id)) and q.status = 'approved') approved,
      (select count(*)::int from ai_extraction_queue q where q.invocation_id = any(array_agg(i.id)) and q.status = 'rejected') rejected
    from ai_invocations i join ai_models m on m.id = i.model_id group by 1, 2, 3`)) as unknown as { rows: Record<string, unknown>[] }
  ).rows;
