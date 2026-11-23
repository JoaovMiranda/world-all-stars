import { active, slugRedirects } from '@was/db';
import { eq } from 'drizzle-orm';

import type { AppDeps } from '../http/app-deps.interface';
import type { SluggedTable } from './slugged-table.type';

/** Current slug for an old one, or null when the slug is current or unknown. */
export const resolveSlugRedirect = async (deps: AppDeps, entityType: 'sport' | 'competitor', slug: string, table: SluggedTable): Promise<string | null> => {
  const [current] = await deps.db
    .select({ id: table.id })
    .from(table)
    .where(active(table, eq(table.slug, slug)))
    .limit(1);
  if (current) return null;
  const [hit] = await deps.db
    .select({ slug: table.slug })
    .from(slugRedirects)
    .innerJoin(table, eq(table.id, slugRedirects.entityId))
    .where(active(slugRedirects, eq(slugRedirects.entityType, entityType), eq(slugRedirects.oldSlug, slug)))
    .limit(1);
  return hit?.slug ?? null;
};
