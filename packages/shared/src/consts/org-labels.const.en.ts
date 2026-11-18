import type { Messages } from '../i18n/messages.helper';
import type { ORG_LABELS_TEXT } from './org-labels.const';

export const ORG_LABELS_TEXT_EN = {
  nature: {
    association: 'Non-profit association',
    company: 'Company',
    brand: 'Brand',
    community: 'Community / culture',
    media: 'Media',
    unknown: 'Unclassified',
  },
  relation: {
    member_of: 'member of',
    recognized_by: 'recognized by',
    licensed_by: 'licensed by',
    owned_by: 'owned by',
    affiliated_to: 'affiliated with',
  },
} satisfies Messages<typeof ORG_LABELS_TEXT>;
