import type { EntityRef } from '@was/shared';

import type { FOOTBALL_COMPETITIONS } from './football-champions.const';

/** One champion squad: its entry members and final starters (input of the football observation writer). */
export interface ChampionSquad {
  competition: keyof typeof FOOTBALL_COMPETITIONS;
  year: number;
  gender: 'men' | 'women';
  country: string;
  documentId: string;
  members: { person: EntityRef; appeared: boolean | null; reserve: boolean }[];
  starters: { person: EntityRef; documentId: string }[];
}
