import { active, athleteSuggestions } from '@was/db';
import {
  BJJ_PROVIDER,
  FOOTBALL_PROVIDER,
  firstCollect,
  type IngestContext,
  OllamaProvider,
  PROVIDERS,
  parseAthleteList,
  updateCollect,
  WIKIDATA_PROFILE_PROVIDER,
  WIKIDATA_PROVIDER,
} from '@was/ingest';
import { eq } from 'drizzle-orm';

/** Admin job key → provider. */
export const PROVIDER_OF_JOB: Record<string, string> = {
  'wikidata.athletes': WIKIDATA_PROVIDER,
  [WIKIDATA_PROVIDER]: WIKIDATA_PROVIDER,
  'football.rsssf': FOOTBALL_PROVIDER,
  [FOOTBALL_PROVIDER]: FOOTBALL_PROVIDER,
  [BJJ_PROVIDER]: BJJ_PROVIDER,
  // Fase 13: autonomous collection (one orchestrator, two modes).
  'collect.list': 'collect.list',
  'collect.update': 'collect.update',
  'collect.discovery': 'collect.discovery',
};
export const COLLECT = new Set(['collect.list', 'collect.update', 'collect.discovery']);

/** Discovery step of each admin job: providers run from the shared registry (`PROVIDERS`), with their defaults. */
export const DISCOVERY: Record<string, (ctx: IngestContext, params: Record<string, unknown>) => Promise<unknown>> = {
  [FOOTBALL_PROVIDER]: (ctx) => PROVIDERS.run(FOOTBALL_PROVIDER, ctx),
  [BJJ_PROVIDER]: (ctx) => PROVIDERS.run(BJJ_PROVIDER, ctx),
  // Identity (QID) first, then the profile (bio, photo, birthplace, clubs…).
  [WIKIDATA_PROVIDER]: async (ctx) => [...(await PROVIDERS.run(WIKIDATA_PROVIDER, ctx)), ...(await PROVIDERS.run(WIKIDATA_PROFILE_PROVIDER, ctx))],
  // Without OLLAMA_URL the profiles are still collected and reported as needs_enrichment.
  'collect.list': (ctx, p) => firstCollect(ctx, OllamaProvider.fromEnv(), parseAthleteList(String(p.names ?? ''))),
  'collect.update': (ctx) => updateCollect(ctx, OllamaProvider.fromEnv()),
  'collect.discovery': async (ctx) => {
    // Approved reader suggestions: the Wikipedia link when given, else the name.
    const rows = await ctx.db
      .select()
      .from(athleteSuggestions)
      .where(active(athleteSuggestions, eq(athleteSuggestions.status, 'approved')));
    const lines = rows.filter((r) => !r.existingAthleteId).map((r) => r.urls.find((u) => /wikipedia\.org\/wiki\//.test(u)) ?? r.athleteName);
    return firstCollect(ctx, OllamaProvider.fromEnv(), parseAthleteList(lines.join('\n')));
  },
};
