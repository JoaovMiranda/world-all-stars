import { active, athleteSuggestions } from '@was/db';
import {
  BJJ_PROVIDER,
  type createContext,
  FOOTBALL_PROVIDER,
  firstCollect,
  OllamaProvider,
  parseAthleteList,
  runBjjChampions,
  runFootballChampions,
  runWikidata,
  runWikidataProfile,
  updateCollect,
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

export const DISCOVERY: Record<string, (ctx: ReturnType<typeof createContext>, params: Record<string, unknown>) => Promise<unknown>> = {
  [FOOTBALL_PROVIDER]: (ctx) => runFootballChampions(ctx),
  [BJJ_PROVIDER]: (ctx) => runBjjChampions(ctx),
  // Identity (QID) first, then the profile (bio, photo, birthplace, clubs…).
  [WIKIDATA_PROVIDER]: async (ctx) => [...(await runWikidata(ctx)), ...(await runWikidataProfile(ctx))],
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
