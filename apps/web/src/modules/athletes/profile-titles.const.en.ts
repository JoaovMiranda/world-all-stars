import type { Messages } from '@was/shared';

import type { PROFILE_TITLES_TEXT } from './profile-titles.const';

export const PROFILE_TITLES_TEXT_EN: Messages<typeof PROFILE_TITLES_TEXT> = {
  title: 'Titles',
  count: (n: number) => (n === 1 ? '1 title or medal' : `${n} titles and medals`),
  kindsLabel: (competition: string) => `Results at ${competition}`,
  kinds: { champion: 'Champion', title_won: 'Title won', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' },
  kindCount: (label: string, n: number) => `${label} · ${n}`,
  times: (n: number) => `×${n}`,
};
