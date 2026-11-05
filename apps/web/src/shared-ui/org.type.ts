import type { Organization, SportAssociation } from '@was/shared';

/** What the org components accept: a full organization, optionally with its roles/chain in a sport. */
export type OrgLike = Organization & Partial<Pick<SportAssociation, 'roles' | 'chain'>>;
/** Minimal org for logo/name (also works with chain items). */
export type OrgIdentity = { name: string; wikipedia: string | null; image?: string | null };
