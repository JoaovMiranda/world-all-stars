import type { Messages } from '@was/shared';

import type { HALL_OF_GREATS_TEXT } from './hall-of-greats.const';

export const HALL_OF_GREATS_TEXT_EN = {
  page: {
    title: 'Hall of Greats',
    heading: 'The ones who changed the game',
    eyebrow: 'Hall of Greats',
    lead: 'Winning everything is not enough: to enter the Hall, a champion must have changed their own sport. Every name has a public dossier with evidence and sources.',
  },
  rules: {
    label: 'Entry rules',
    items: [
      { title: '1. Mythic tier', text: 'Only athletes rated Mythic. The tier is never automatic.' },
      { title: '2. “Game changer” dossier', text: 'At least 2 pieces of evidence (historic record, technique, rule change, popularization, recognition), each with a source.' },
      { title: '3. Double approval', text: 'Two admins approve the dossier. Everything is versioned.' },
    ],
  },
  legends: {
    label: 'The Mythics in the Hall',
    evidences: (n) => (n === 1 ? '1 piece of evidence' : `${n} pieces of evidence`),
    approvals: (n) => (n === 1 ? '1 approval' : `${n} approvals`),
    emptyTitle: 'No Mythics in the Hall yet',
    emptyText: 'The Hall only takes Mythic athletes whose dossier was approved by two admins. The first names appear here as soon as they are enshrined.',
    emptyAction: 'How someone becomes Mythic',
  },
  queue: {
    title: 'In line: Legendaries without a dossier',
    eyebrow: 'the curators are preparing the dossier',
    emptyTitle: 'Nobody in line',
    emptyText: 'When a Legendary is nominated for the Hall, they appear here while the curators prepare the dossier.',
  },
} satisfies Messages<typeof HALL_OF_GREATS_TEXT>;
