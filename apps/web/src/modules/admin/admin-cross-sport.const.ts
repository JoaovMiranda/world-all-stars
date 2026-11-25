import { defineMessages } from '@was/shared';

import { ADMIN_CROSS_SPORT_TEXT_EN } from './admin-cross-sport.const.en';
import { ADMIN_CROSS_SPORT_TEXT_ES } from './admin-cross-sport.const.es';

// UI strings of the admin review list of unmapped cross-sport facts (pt-BR source; en/es next to it).
export const ADMIN_CROSS_SPORT_TEXT = {
  title: 'Faixas: conquistas sem mapeamento',
  lead: 'Conquistas competitivas publicadas que ainda não têm linha de mapeamento no conjunto de regras. Elas ficam fora da faixa (nunca valem zero nem são adivinhadas) até a curadoria criar o mapeamento.',
  navGroup: 'Faixas entre esportes',
  navLink: 'Sem mapeamento',
  caption: 'Conquistas sem mapeamento',
  competitor: 'Competidor',
  sport: 'Esporte',
  kind: 'Tipo',
  value: 'Valor a mapear',
  achievement: 'Conquista',
  year: 'Ano',
  kinds: { recognition: 'Título', result: 'Resultado' } as Record<string, string>,
  total: (n: number) => (n === 1 ? '1 conquista em revisão' : `${n} conquistas em revisão`),
  emptyTitle: 'Nada para revisar',
  emptyText: 'Toda conquista competitiva publicada tem mapeamento.',
  methodologyLink: 'Ver a metodologia e os mapeamentos atuais',
};
export const ADMIN_CROSS_SPORT_MESSAGES = defineMessages(ADMIN_CROSS_SPORT_TEXT, { en: ADMIN_CROSS_SPORT_TEXT_EN, es: ADMIN_CROSS_SPORT_TEXT_ES });
