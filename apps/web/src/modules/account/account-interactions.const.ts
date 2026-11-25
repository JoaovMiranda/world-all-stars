// UI strings of the "My star and hearts" section of the account page (D02/D03; pt-BR source, en/es next to it).
import { defineMessages } from '@was/shared';

import { ACCOUNT_INTERACTIONS_TEXT_EN } from './account-interactions.const.en';
import { ACCOUNT_INTERACTIONS_TEXT_ES } from './account-interactions.const.es';

export const ACCOUNT_INTERACTIONS_TEXT = {
  starTitle: 'Minha estrela',
  starHint: 'Só você vê esta lista. Cada conta tem uma única estrela; no perfil, só aparece o total.',
  noStarTitle: 'Nenhuma estrela dada',
  noStarText: 'Dê sua estrela ao atleta que você mais admira, no perfil dele.',
  heartsTitle: 'Meus corações',
  noHeartsTitle: 'Nenhum coração ainda',
  noHeartsText: 'Dê quantos corações quiser nos perfis dos atletas.',
  since: (date: string) => `desde ${date}`,
  removeStar: (name: string) => `Tirar minha estrela de ${name}`,
  removeHeart: (name: string) => `Tirar meu coração de ${name}`,
  remove: 'Tirar',
  browseAthletes: 'Ver atletas',
};

export const ACCOUNT_INTERACTIONS_MESSAGES = defineMessages(ACCOUNT_INTERACTIONS_TEXT, { en: ACCOUNT_INTERACTIONS_TEXT_EN, es: ACCOUNT_INTERACTIONS_TEXT_ES });
