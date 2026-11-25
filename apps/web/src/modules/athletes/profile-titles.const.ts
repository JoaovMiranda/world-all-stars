import { defineMessages } from '@was/shared';

import { PROFILE_TITLES_TEXT_EN } from './profile-titles.const.en';
import { PROFILE_TITLES_TEXT_ES } from './profile-titles.const.es';

// UI strings of the "Titles" section of the profiles (T4.3) (pt-BR source; en/es next to it).
export const PROFILE_TITLES_TEXT = {
  title: 'Títulos',
  count: (n: number) => (n === 1 ? '1 título ou medalha' : `${n} títulos e medalhas`),
  kindsLabel: (competition: string) => `Resultados em ${competition}`,
  kinds: { champion: 'Campeão', title_won: 'Título conquistado', gold: 'Ouro', silver: 'Prata', bronze: 'Bronze' } as Record<string, string>,
  kindCount: (label: string, n: number) => `${label} · ${n}`,
  times: (n: number) => `×${n}`,
};
export const PROFILE_TITLES_MESSAGES = defineMessages(PROFILE_TITLES_TEXT, { en: PROFILE_TITLES_TEXT_EN, es: PROFILE_TITLES_TEXT_ES });
