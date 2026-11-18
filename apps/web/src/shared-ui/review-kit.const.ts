import { defineMessages } from '@was/shared';

import { REVIEW_KIT_TEXT_EN } from './review-kit.const.en';
import { REVIEW_KIT_TEXT_ES } from './review-kit.const.es';

// pt-BR strings of the review kit (ConfirmDialog, DecisionBar, DiffView, StatusFilter, ReviewQueue). en/es next to it.
export const REVIEW_KIT_TEXT = {
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  working: 'Salvando…',
  reasonLabel: 'Motivo',
  reasonHint: 'Fica registrado na auditoria.',
  reasonTooShort: (n: number) => `Escreva pelo menos ${n} caracteres.`,
  genericError: 'Não foi possível concluir. Tente de novo.',
  all: 'Todos',
  diffBase: 'Base (quando a proposta nasceu)',
  diffCurrent: 'Atual (publicado)',
  diffProposed: 'Proposto',
  diffChanged: 'difere da base',
  diffConflict: 'O valor publicado mudou depois que a proposta foi criada: confira as três versões antes de aprovar.',
  emptyValue: '—',
  queueDetail: 'Detalhe do item selecionado',
} as const;

export const REVIEW_KIT_MESSAGES = defineMessages(REVIEW_KIT_TEXT, { en: REVIEW_KIT_TEXT_EN, es: REVIEW_KIT_TEXT_ES });
