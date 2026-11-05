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
