import type { Messages } from '@was/shared';

import type { REVIEW_KIT_TEXT } from './review-kit.const';

export const REVIEW_KIT_TEXT_EN = {
  cancel: 'Cancel',
  confirm: 'Confirm',
  working: 'Saving…',
  reasonLabel: 'Reason',
  reasonHint: 'Recorded in the audit log.',
  reasonTooShort: (n) => `Write at least ${n} characters.`,
  genericError: 'Couldn’t finish. Please try again.',
  all: 'All',
  diffBase: 'Base (when the proposal was created)',
  diffCurrent: 'Current (published)',
  diffProposed: 'Proposed',
  diffChanged: 'differs from base',
  diffConflict: 'The published value changed after the proposal was created: check all three versions before approving.',
  emptyValue: '—',
  queueDetail: 'Details of the selected item',
} satisfies Messages<typeof REVIEW_KIT_TEXT>;
