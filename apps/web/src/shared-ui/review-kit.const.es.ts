import type { Messages } from '@was/shared';

import type { REVIEW_KIT_TEXT } from './review-kit.const';

export const REVIEW_KIT_TEXT_ES = {
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  working: 'Guardando…',
  reasonLabel: 'Motivo',
  reasonHint: 'Queda registrado en la auditoría.',
  reasonTooShort: (n) => `Escribe al menos ${n} caracteres.`,
  genericError: 'No se pudo completar. Inténtalo de nuevo.',
  all: 'Todos',
  diffBase: 'Base (cuando se creó la propuesta)',
  diffCurrent: 'Actual (publicado)',
  diffProposed: 'Propuesto',
  diffChanged: 'difiere de la base',
  diffConflict: 'El valor publicado cambió después de crear la propuesta: revisa las tres versiones antes de aprobar.',
  emptyValue: '—',
  queueDetail: 'Detalle del elemento seleccionado',
} satisfies Messages<typeof REVIEW_KIT_TEXT>;
