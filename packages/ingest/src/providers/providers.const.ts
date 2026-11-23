import { BjjChampionsProvider } from './bjj-champions.provider';
import { FootballChampionsProvider } from './football-champions.provider';
import { OlympicMedalistsProvider } from './olympic-medalists.provider';
import { ProviderRegistry } from './provider.registry';
import { WikidataProvider } from './wikidata.provider';
import { WikidataProfileProvider } from './wikidata-profile.provider';

/**
 * The discovery providers, by key: ONE registry shared by the CLI (`pnpm ingest`, its job worker) and the admin
 * ingestion runner. The athlete list is not here: it is driven by the autonomous collection (`collect.ts`).
 */
export const PROVIDERS = new ProviderRegistry([
  new FootballChampionsProvider(),
  new BjjChampionsProvider(),
  new OlympicMedalistsProvider(),
  new WikidataProvider(),
  new WikidataProfileProvider(),
]);
