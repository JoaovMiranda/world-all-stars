import type { AthleteProfile } from '@was/shared';
import { describe, expect, it } from 'vitest';

import { olympicTally } from './olympic-medals.helper';

const a = (type: string, year: number, isOlympic = true) => ({ kind: 'competition', type, year, isOlympic });

describe('olympicTally', () => {
  it('counts Olympic medals per metal and lists the medal years once', () => {
    const p = { achievements: [a('gold', 2008), a('gold', 2008), a('silver', 2004), a('bronze', 2004), a('champion', 2010, false), a('award', 2012)] };
    expect(olympicTally(p as unknown as AthleteProfile)).toEqual({ gold: 2, silver: 1, bronze: 1, years: [2004, 2008] });
  });
});
