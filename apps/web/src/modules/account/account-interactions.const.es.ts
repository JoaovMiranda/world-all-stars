import type { Messages } from '@was/shared';

import type { ACCOUNT_INTERACTIONS_TEXT } from './account-interactions.const';

export const ACCOUNT_INTERACTIONS_TEXT_ES = {
  starTitle: 'Mi estrella',
  starHint: 'Solo tú ves esta lista. Cada cuenta tiene una sola estrella; en los perfiles solo aparece el total.',
  noStarTitle: 'Ninguna estrella dada',
  noStarText: 'Da tu estrella al atleta que más admiras, en su perfil.',
  heartsTitle: 'Mis corazones',
  noHeartsTitle: 'Todavía no hay corazones',
  noHeartsText: 'Da tantos corazones como quieras en los perfiles de los atletas.',
  since: (date) => `desde ${date}`,
  removeStar: (name) => `Quitar mi estrella de ${name}`,
  removeHeart: (name) => `Quitar mi corazón de ${name}`,
  remove: 'Quitar',
  browseAthletes: 'Ver atletas',
} satisfies Messages<typeof ACCOUNT_INTERACTIONS_TEXT>;
