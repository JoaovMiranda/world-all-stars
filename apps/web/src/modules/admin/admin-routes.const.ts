import type { AdminSection } from '@was/shared';

/** Typed path of each admin section (one route per section, app/router.tsx). */
export const ADMIN_SECTION_PATH = {
  review: '/admin/review',
  ingestion: '/admin/ingestion',
  sources: '/admin/sources',
  users: '/admin/users',
  privacy: '/admin/privacy',
  dossiers: '/admin/dossiers',
  comments: '/admin/comments',
  contact: '/admin/contact',
} as const satisfies Record<AdminSection, `/admin/${string}`>;

/** Order of the navigation (doc 09 A1–A8). */
export const ADMIN_NAV_ORDER: readonly AdminSection[] = ['review', 'ingestion', 'sources', 'users', 'privacy', 'dossiers', 'comments', 'contact'];

/**
 * Miller/Hick: the side nav shows the 8 sections in 3 named groups (≤ 4 each) instead of one list of 9 links.
 * The admin home keeps ADMIN_NAV_ORDER.
 */
export const ADMIN_NAV_GROUPS = [
  { key: 'moderation', sections: ['review', 'dossiers', 'comments', 'contact'] },
  { key: 'data', sections: ['ingestion', 'sources'] },
  { key: 'people', sections: ['users', 'privacy'] },
] as const satisfies readonly { key: string; sections: readonly AdminSection[] }[];
