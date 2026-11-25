// UI strings of the comment edit window and report button (T3.3; pt-BR source, en/es next to it).
import { defineMessages } from '@was/shared';

import { COMMENT_MODERATION_TEXT_EN } from './comment-moderation.const.en';
import { COMMENT_MODERATION_TEXT_ES } from './comment-moderation.const.es';

export const COMMENT_MODERATION_TEXT = {
  edit: 'Editar',
  editLabel: 'Editar comentário',
  editHint: 'Você pode editar por até 10 minutos depois de publicar.',
  save: 'Salvar',
  cancel: 'Cancelar',
  edited: 'editado',
  editFailed: 'Não deu para salvar a edição. Tente de novo.',
  report: 'Denunciar',
  reportLabel: (author: string) => `Denunciar o comentário de ${author}`,
  reportTitle: 'Denunciar este comentário?',
  reportText: 'Os moderadores vão revisá-lo. Use para ofensas, spam ou desinformação, não para discordar.',
  reportConfirm: 'Denunciar',
  reported: 'Denunciado. Obrigado.',
};

export const COMMENT_MODERATION_MESSAGES = defineMessages(COMMENT_MODERATION_TEXT, { en: COMMENT_MODERATION_TEXT_EN, es: COMMENT_MODERATION_TEXT_ES });
