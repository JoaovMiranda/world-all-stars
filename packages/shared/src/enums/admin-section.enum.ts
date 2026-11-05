/** Sections of the admin area (doc 09 A1–A8), routed as /admin/$section. */
export const AdminSection = {
  Review: 'review',
  Ingestion: 'ingestion',
  Sources: 'sources',
  Users: 'users',
  Comments: 'comments',
  Contact: 'contact',
  Dossiers: 'dossiers',
  Privacy: 'privacy',
} as const;
export type AdminSection = (typeof AdminSection)[keyof typeof AdminSection];
export const ADMIN_SECTION_VALUES = Object.values(AdminSection) as [AdminSection, ...AdminSection[]];
