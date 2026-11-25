// Temporary pilot analysis (T1.6): per athlete, outcome + call chain. Deleted after the pilot.
import { createDatabase, selectRows } from '@was/db';
import { sql } from 'drizzle-orm';
const h = await createDatabase({ pgliteDataDir: process.env.PGLITE_DATA_DIR! });
const people = await selectRows<any>(h.db, sql`
  select distinct a.id, a.known_as, sl.url from athletes a join source_links sl on sl.entity_id = a.id where sl.id in (select source_link_id from ai_extraction_queue where section_key = 'biography')`);
const inv = await selectRows<any>(h.db, sql`select i.input_ref, i.task, i.status, i.validation_level lvl, i.error, i.output, i.evidence, i.created_at from ai_invocations i order by i.created_at`);
const q = await selectRows<any>(h.db, sql`
  select sl.entity_id, q.status, q.result_json->>'level' lvl, q.result_json->>'copied' copied, q.result_json->>'en' en from ai_extraction_queue q join source_links sl on sl.id = q.source_link_id where q.section_key = 'biography'`);
const out: any[] = [];
for (const p of people) {
  const calls = inv.filter((i) => i.input_ref.split('#')[0] === p.url);
  const qq = q.find((r) => r.entity_id === p.id);
  const outcome = !qq ? 'rejected' : qq.status === 'approved' ? 'accepted' : 'queued';
  const chain = calls.map((c) => c.task === 'biography' ? `bio L${c.lvl}${c.status === 'error' ? '(err)' : ''}` : `fc ${c.lvl === 4 ? 'supported' : c.status === 'error' ? 'invalid' : 'unsupported:' + (c.output?.claims ?? []).filter((x: any) => x.status !== 'supported').map((x: any) => x.claim).join('/')}`).join(' → ');
  out.push({ name: p.known_as, outcome, level: qq?.lvl ?? null, copied: qq?.copied ?? null, chain, en: process.env.SHOW_BIO ? qq?.en : undefined });
}
for (const o of out) console.log(JSON.stringify(o));
const n = (k: string) => out.filter((o) => o.outcome === k).length;
console.log(JSON.stringify({ athletes: out.length, accepted: n('accepted'), queued: n('queued'), rejected: n('rejected'), bioCalls: inv.filter((i) => i.task === 'biography').length, factCalls: inv.filter((i) => i.task === 'fact-check').length }));
if (process.env.DETAIL) for (const i of inv) console.log(JSON.stringify({ ref: i.input_ref, task: i.task, lvl: i.lvl, err: i.error, out: i.output }));
await h.close();
