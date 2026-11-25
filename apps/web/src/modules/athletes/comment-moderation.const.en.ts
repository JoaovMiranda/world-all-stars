import type { Messages } from '@was/shared';

import type { COMMENT_MODERATION_TEXT } from './comment-moderation.const';

export const COMMENT_MODERATION_TEXT_EN = {
  edit: 'Edit',
  editLabel: 'Edit comment',
  editHint: 'You can edit for up to 10 minutes after posting.',
  save: 'Save',
  cancel: 'Cancel',
  edited: 'edited',
  editFailed: 'Could not save the edit. Try again.',
  report: 'Report',
  reportLabel: (author) => `Report the comment by ${author}`,
  reportTitle: 'Report this comment?',
  reportText: 'The moderators will review it. Use it for abuse, spam or misinformation, not to disagree.',
  reportConfirm: 'Report',
  reported: 'Reported. Thank you.',
} satisfies Messages<typeof COMMENT_MODERATION_TEXT>;
