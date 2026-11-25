import type { Messages } from '@was/shared';

import type { PROFILE_TITLES_TEXT } from './profile-titles.const';

export const PROFILE_TITLES_TEXT_ES: Messages<typeof PROFILE_TITLES_TEXT> = {
  title: 'Títulos',
  count: (n: number) => (n === 1 ? '1 título o medalla' : `${n} títulos y medallas`),
  kindsLabel: (competition: string) => `Resultados en ${competition}`,
  kinds: { champion: 'Campeón', title_won: 'Título ganado', gold: 'Oro', silver: 'Plata', bronze: 'Bronce' },
  kindCount: (label: string, n: number) => `${label} · ${n}`,
  times: (n: number) => `×${n}`,
};
