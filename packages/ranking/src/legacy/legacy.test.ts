// Legacy rules (D11): L5 needs an approved dossier; legacy never alters ranking scores or bands.
import { describe, expect, it } from 'vitest';

import type { RankingEvidence } from '../core/ranking-evidence.interface';
import { computeLegacyLevel } from './legacy.helper';

let seq = 0;
const honor = (recognition: string, year: number, extra: Record<string, string | number> = {}): RankingEvidence => ({
  id: `l${++seq}`,
  version: 1,
  kind: 'recognition',
  competitorId: 'x',
  attributes: { recognition, year, ...extra },
});

describe('legacy levels', () => {
  it('computes L1–L4 from accepted honors and longevity', () => {
    expect(computeLegacyLevel([honor('world_champion', 1970)]).level).toBe('L1');
    expect(computeLegacyLevel([honor('world_champion', 1970), honor('world_champion', 1974), honor('record', 1975)]).level).toBe('L2');
  });

  it('L5 is impossible without an approved Hall dossier, even above the threshold', () => {
    const above = [1970, 1972, 1974, 1976, 1978, 1980, 1982, 1984, 1986].map((year) => honor('world_champion', year));
    const computed = computeLegacyLevel(above);
    expect(computed.score).toBeGreaterThanOrEqual(80);
    expect(computed.level).toBe('L4');
    expect(computed.explanation).toContain('approved Hall dossier');
  });

  it('an approved dossier plus the threshold reaches L5; a pending one does not', () => {
    const honors = [1970, 1972, 1974, 1976, 1978, 1980, 1982, 1984].map((year) => honor('world_champion', year));
    const dossier = (status: string): RankingEvidence => ({ id: `d-${status}`, version: 1, kind: 'dossier', competitorId: 'x', attributes: { status } });
    expect(computeLegacyLevel([...honors, dossier('approved')])).toMatchObject({ level: 'L5' });
    expect(computeLegacyLevel([...honors, dossier('pending')])).toMatchObject({ level: 'L4' });
  });

  it('unverified honors are excluded with a reason', () => {
    const r = computeLegacyLevel([honor('world_champion', 1970, { verification: 'provisional' })]);
    expect(r.accepted).toHaveLength(0);
    expect(r.excluded[0]!.reason).toBe('not verified');
    expect(r.level).toBe('L0');
  });
});
