// pnpm ingest <command> [options] — manual CLI of the ingestion pipeline (handoff v3 §6.3, A03).
//   football [--only fifa-world-cup:2002,...] [--no-olympics]   discovery of champion squads, starters and titles
//   bjj [--only adcc:2019,...]                                  ADCC + IBJJF champions with year and division
//   olympics --sport swimming --list "List of Olympic medalists in swimming" [--year 2016]
//   wikidata [--limit 500]                                      QIDs, birth and gender through enwiki sitelinks
//   profiles [--limit N]                                        profile from Wikidata + Commons photo (bio, birthplace, clubs…)
//   write [--providers football-champions,bjj-champions,...]    canonical writer (identity + domain)
//   enqueue <provider> [--only …]                               queue a job; `worker` processes queued jobs
//   worker [--max N]                                            claims and runs job items (retries, dead-letter)
//   report                                                      counts per stage, last runs, AI usage
//   identity-eval                                               precision/recall of the identity thresholds
//   enrich [--athlete slug] [--task biography|facts|all] [--limit 20]   optional AI (OLLAMA_URL) → admin queue
//   collect --list <file> [--sport slug] | --names "Cafu,Pelé" | --update [--limit N]   autonomous collection (Fase 13)
//   ai-report                                                   calls, tokens, latency, approvals per model × task
// Flags: --offline (crawler cache only, no network). PGlite is single-process: stop `pnpm dev` first.
import fs from 'node:fs';

import { BaseCli, ingestionRuns } from '@was/db';
import { desc, sql } from 'drizzle-orm';

import { CanonicalWriter } from '../canonical/canonical-writer';
import { enrichItemOf, firstCollect, peopleWithArticle, updateCollect } from '../collect';
import { aiReport } from '../enrich/ai-report.helper';
import type { EnrichItem } from '../enrich/enrich-item.interface';
import { OllamaProvider } from '../enrich/ollama.provider';
import { runBiography } from '../enrich/run-biography.service';
import { runEnrichment } from '../enrich/run-enrichment.service';
import { IDENTITY_SAMPLE } from '../identity/identity-sample.const';
import { IDENTITY_THRESHOLDS } from '../identity/identity-thresholds.const';
import { scoreCandidate } from '../identity/resolver';
import { enqueueJob, runWorker } from '../jobs/queue';
import { parseAthleteList } from '../providers/athlete-list.provider';
import { BJJ_PROVIDER } from '../providers/bjj-champions.const';
import { createContext } from '../providers/context';
import { FOOTBALL_PROVIDER } from '../providers/football-champions.const';
import type { IngestContext } from '../providers/ingest-context.interface';
import { OLYMPIC_PROVIDER } from '../providers/olympic-medalists.const';
import { PROVIDERS } from '../providers/providers.const';
import { WIKIDATA_PROVIDER } from '../providers/wikidata.const';
import { WIKIDATA_PROFILE_PROVIDER } from '../providers/wikidata-profile.const';

class IngestCli extends BaseCli {
  protected async run(): Promise<void> {
    const command = this.command ?? 'report';
    const flag = (name: string) => this.flag(name);
    const list = (name: string) => this.list(name);
    const db = this.db;
    const log = this.log;
    const ctx: IngestContext = createContext(db, { offline: flag('offline') === 'true', log });
    const write = async (providers: string[]) => {
      const report = await new CanonicalWriter(db).writeProviders(providers);
      log(`canonical: ${JSON.stringify(report)}`);
    };

    if (command === 'football') {
      for (const l of await PROVIDERS.run(FOOTBALL_PROVIDER, ctx, { only: list('only'), olympics: flag('no-olympics') !== 'true' })) log(l);
      await write([FOOTBALL_PROVIDER]);
    } else if (command === 'bjj') {
      for (const l of await PROVIDERS.run(BJJ_PROVIDER, ctx, { only: list('only') })) log(l);
      await write([BJJ_PROVIDER]);
    } else if (command === 'olympics') {
      for (const l of await PROVIDERS.run(OLYMPIC_PROVIDER, ctx, { sport: flag('sport'), list: flag('list'), year: flag('year') })) log(l);
      await write([OLYMPIC_PROVIDER]);
    } else if (command === 'wikidata') {
      for (const l of await PROVIDERS.run(WIKIDATA_PROVIDER, ctx, { limit: flag('limit') })) log(l);
      await write([WIKIDATA_PROVIDER]);
    } else if (command === 'profiles') {
      for (const l of await PROVIDERS.run(WIKIDATA_PROFILE_PROVIDER, ctx, { limit: flag('limit') })) log(l);
      await write([WIKIDATA_PROFILE_PROVIDER]);
    } else if (command === 'write') {
      await write(list('providers') ?? PROVIDERS.keys());
    } else if (command === 'enqueue') {
      const provider = this.args[1]!;
      if (!PROVIDERS.has(provider)) throw new Error(`unknown provider ${provider}`);
      const params = { only: list('only'), sport: flag('sport'), list: flag('list'), year: flag('year') };
      const { run, created } = await enqueueJob(db, { jobKey: provider, params, items: [{ key: 'discover' }, { key: 'write' }], mode: 'cli' });
      log(`${created ? 'queued' : 'already running'}: ${run.id} (${provider})`);
    } else if (command === 'worker') {
      const processed = await runWorker(
        db,
        Object.fromEntries(
          PROVIDERS.keys().map((key) => [
            key,
            async (item, run) => {
              if (item.itemKey === 'discover')
                return { report: await PROVIDERS.run(key, createContext(db, { jobId: run.id, offline: flag('offline') === 'true', log }), run.params) };
              await write([key]);
            },
          ]),
        ),
        { maxItems: flag('max') ? Number(flag('max')) : undefined },
      );
      log(`worker: ${processed} item(s) processed`);
    } else if (command === 'report') {
      const counts = (await db.execute(sql`
        select 'documents' k, count(*)::int n from source_documents union all select 'payloads', count(*) from source_payloads
        union all select 'observations', count(*) from source_observations union all select 'identity candidates (pending)', count(*) from identity_candidates where status = 'pending'
        union all select 'people', count(*) from athletes where deleted_at is null union all select 'public profiles', count(*) from competitors where kind = 'person' and profile_visibility = 'public'
        union all select 'entries', count(*) from competition_entries union all select 'squad members', count(*) from entry_members
        union all select 'results', count(*) from competition_results union all select 'grants', count(*) from recognition_grants
        union all select 'conflicts (pending)', count(*) from field_conflicts where resolution = 'pending'
        union all select 'dead job items', count(*) from ingestion_job_items where status = 'dead'`)) as unknown as { rows: { k: string; n: number }[] };
      for (const r of counts.rows) log(`${r.k.padEnd(32)} ${String(r.n).padStart(7)}`);
      for (const r of await db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.startedAt)).limit(5))
        log(`run ${r.jobKey} ${r.status} ${r.startedAt.toISOString()} checked=${r.checked} errors=${r.errors}`);
    } else if (command === 'enrich') {
      // Optional AI layer: needs OLLAMA_URL (+ OLLAMA_MODEL). Proposals go to the admin queue; nothing is published.
      const provider = OllamaProvider.fromEnv();
      if (!provider) log('enrich: OLLAMA_URL not set: skipped (the deterministic pipeline does not depend on it)');
      const people = await peopleWithArticle(db, null, { slug: flag('athlete'), limit: Number(flag('limit') ?? 20) });
      const items: EnrichItem[] = [];
      for (const p of provider ? people : []) {
        const item = await enrichItemOf(ctx, p, 'article');
        if (item) items.push(item);
      }
      const task = flag('task') ?? 'biography';
      if (task === 'biography' || task === 'all') log(`biography: ${JSON.stringify(await runBiography(db, provider, items))}`);
      if (task === 'facts' || task === 'all')
        log(
          `facts: ${JSON.stringify(
            await runEnrichment(
              db,
              provider,
              items.map((i) => ({ ...i, sourceText: i.sourceText.slice(0, 6000) })),
            ),
          )}`,
        );
    } else if (command === 'collect') {
      const provider = OllamaProvider.fromEnv();
      if (!provider) log('collect: OLLAMA_URL not set: profiles are collected and marked needs_enrichment');
      const file = flag('list');
      const text = file ? fs.readFileSync(file, 'utf8') : (flag('names') ?? '').split(',').join('\n');
      const r =
        flag('update') === 'true'
          ? await updateCollect(ctx, provider, { limit: flag('limit') ? Number(flag('limit')) : undefined })
          : await firstCollect(ctx, provider, parseAthleteList(text, flag('sport') ?? null));
      log(`collect: ${JSON.stringify(r)}`);
    } else if (command === 'ai-report') {
      for (const r of await aiReport(db)) log(JSON.stringify(r));
    } else if (command === 'identity-eval') {
      for (const t of [0.9, 0.95, IDENTITY_THRESHOLDS.auto, 0.99]) {
        const r = IDENTITY_SAMPLE.map((s) => ({ s, score: scoreCandidate(s.query, s.candidate) }));
        const fp = r.filter((x) => !x.s.same && x.score >= t).length;
        const fn = r.filter((x) => x.s.same && x.score < IDENTITY_THRESHOLDS.review).length;
        const autoTp = r.filter((x) => x.s.same && x.score >= t).length;
        const review = r.filter((x) => x.score >= IDENTITY_THRESHOLDS.review && x.score < t).length;
        const same = r.filter((x) => x.s.same).length;
        log(
          `auto ≥ ${t}: precision ${(autoTp / Math.max(1, autoTp + fp)).toFixed(2)} · false positives ${fp} · recall (auto+review) ${((same - fn) / same).toFixed(2)} · false negatives ${fn} · manual review ${review}/${r.length}`,
        );
      }
    } else {
      throw new Error(`unknown command ${command}`);
    }
  }
}

await new IngestCli().start();
