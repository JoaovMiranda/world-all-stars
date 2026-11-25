import type { Messages } from '@was/shared';

import type { COMMENT_MODERATION_TEXT } from './comment-moderation.const';

export const COMMENT_MODERATION_TEXT_ES = {
  edit: 'Editar',
  editLabel: 'Editar comentario',
  editHint: 'Puedes editar hasta 10 minutos después de publicar.',
  save: 'Guardar',
  cancel: 'Cancelar',
  edited: 'editado',
  editFailed: 'No se pudo guardar la edición. Inténtalo de nuevo.',
  report: 'Denunciar',
  reportLabel: (author) => `Denunciar el comentario de ${author}`,
  reportTitle: '¿Denunciar este comentario?',
  reportText: 'Los moderadores lo revisarán. Úsalo para insultos, spam o desinformación, no para discrepar.',
  reportConfirm: 'Denunciar',
  reported: 'Denunciado. Gracias.',
} satisfies Messages<typeof COMMENT_MODERATION_TEXT>;
