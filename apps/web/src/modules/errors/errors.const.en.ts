import type { Messages } from '@was/shared';

import type { ERRORS_TEXT } from './errors.const';

export const ERRORS_TEXT_EN = {
  shortcutsLabel: 'Shortcuts',
  searchHint: 'Use the search at the top of the page (shortcut: Ctrl+K, or ⌘K on a Mac) to find a champion by name.',
  shortcuts: {
    home: { label: 'Home', hint: 'Globe, on this day and calendar' },
    athletes: { label: 'Athletes', hint: 'Every champion, with filters' },
    sports: { label: 'Sports', hint: 'Sports, leagues and federations' },
    hallOfGreats: { label: 'Hall of Greats', hint: 'The Mythics who changed the game' },
  },
  notFound: {
    code: '404',
    eyebrow: 'Error 404',
    title: 'Page not found',
    text: 'The address may have changed or the record was removed. Search for a champion by name or follow one of the shortcuts.',
    path: 'Address',
    home: 'Back to home',
    report: 'Report a broken link',
  },
  generic: {
    code: '!',
    eyebrow: 'Error',
    title: 'Something went wrong',
    text: 'We couldn’t show this page. Try again; if the problem persists, let us know on the Contact page.',
    retry: 'Try again',
    home: 'Back to home',
    details: 'Technical details',
    report: 'Tell the curators',
  },
} satisfies Messages<typeof ERRORS_TEXT>;
