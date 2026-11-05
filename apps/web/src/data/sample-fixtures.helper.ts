import type { SampleFixtureFiles, SampleFixtureName } from './sample-fixtures.type';

// Lazy: each JSON becomes its own chunk, loaded the first time an endpoint needs it (never in the main bundle).
const modules = import.meta.glob<unknown>('../fixtures/sample/*.json', { import: 'default' });
const cache = new Map<string, Promise<unknown>>();

/** Loads one generated sample fixture (cached). Throws if the file was not exported. */
export const loadSample = <N extends SampleFixtureName>(name: N): Promise<SampleFixtureFiles[N]> => {
  const key = `../fixtures/sample/${name}`;
  const loader = modules[key];
  if (!loader) return Promise.reject(new Error(`Sample fixture ${name} not found. Run pnpm fixtures:export.`));
  if (!cache.has(key)) cache.set(key, loader());
  return cache.get(key) as Promise<SampleFixtureFiles[N]>;
};
