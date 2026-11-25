import type { Messages } from '@was/shared';

import type { ATHLETE_INTERACTIONS_TEXT } from './athlete-interactions.const';

export const ATHLETE_INTERACTIONS_TEXT_ES = {
  groupLabel: 'Estrella y corazones',
  star: (count) => `Dar mi estrella (${count} ${count === 1 ? 'estrella' : 'estrellas'})`,
  unstar: (count) => `Quitar mi estrella (${count} ${count === 1 ? 'estrella' : 'estrellas'})`,
  heart: (count) => `Dar un corazón (${count} ${count === 1 ? 'corazón' : 'corazones'})`,
  unheart: (count) => `Quitar mi corazón (${count} ${count === 1 ? 'corazón' : 'corazones'})`,
  starHint: 'Tienes una sola estrella: darla aquí se la quita a quien la tenía.',
  starElsewhere: (name) => `Tu estrella está con ${name}. Darla aquí la moverá.`,
  failed: 'No se pudo guardar. Inténtalo de nuevo.',
} satisfies Messages<typeof ATHLETE_INTERACTIONS_TEXT>;
