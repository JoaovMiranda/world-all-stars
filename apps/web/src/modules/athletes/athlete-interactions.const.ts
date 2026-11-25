// UI strings of the star/heart buttons on the athlete profile (D02/D03; pt-BR source, en/es next to it).
import { defineMessages } from '@was/shared';

import { ATHLETE_INTERACTIONS_TEXT_EN } from './athlete-interactions.const.en';
import { ATHLETE_INTERACTIONS_TEXT_ES } from './athlete-interactions.const.es';

export const ATHLETE_INTERACTIONS_TEXT = {
  groupLabel: 'Estrela e corações',
  star: (count: number) => `Dar minha estrela (${count} ${count === 1 ? 'estrela' : 'estrelas'})`,
  unstar: (count: number) => `Tirar minha estrela (${count} ${count === 1 ? 'estrela' : 'estrelas'})`,
  heart: (count: number) => `Dar um coração (${count} ${count === 1 ? 'coração' : 'corações'})`,
  unheart: (count: number) => `Tirar meu coração (${count} ${count === 1 ? 'coração' : 'corações'})`,
  starHint: 'Você tem uma única estrela: dá-la aqui a tira de quem a tinha.',
  starElsewhere: (name: string) => `Sua estrela está com ${name}. Dá-la aqui vai movê-la.`,
  failed: 'Não deu para salvar. Tente de novo.',
};

export const ATHLETE_INTERACTIONS_MESSAGES = defineMessages(ATHLETE_INTERACTIONS_TEXT, { en: ATHLETE_INTERACTIONS_TEXT_EN, es: ATHLETE_INTERACTIONS_TEXT_ES });
