import { AdminApi, ParticipationApi, PublicApi } from '@was/shared';
import { describe, expect, it } from 'vitest';

import { emptyOf } from './empty-response.helper';

// GET endpoints whose empty value cannot be derived (need a value from the input or are entity pages → 404).
const OVERRIDDEN = new Set(['/api/home', '/api/athletes/:slug', '/api/sports/:slug', '/api/today/:md', '/api/me', '/api/athletes/:slug/comments', '/api/session', '/api/compare']);

describe('emptyOf (?fixture=empty without hand-written fixtures)', () => {
  const contracts = [...Object.values(PublicApi), ...Object.values(ParticipationApi), ...Object.values(AdminApi)].filter((c) => c.method === 'GET');
  it.each(contracts.filter((c) => !OVERRIDDEN.has(c.path)).map((c) => [c.path, c] as const))('derives a valid empty response for %s', (_path, contract) => {
    expect(contract.response.safeParse(emptyOf(contract.response)).success).toBe(true);
  });
  it('handles nested objects, nullable, records and defaults', () => {
    expect(emptyOf(PublicApi.athletes.response)).toEqual({ items: [], total: 0 });
    expect(emptyOf(PublicApi.hallOfGreats.response)).toEqual({ greats: [], candidates: [] });
  });
});
