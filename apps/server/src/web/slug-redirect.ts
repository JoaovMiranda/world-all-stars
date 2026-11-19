// Old slugs answer 301 to the current URL (handoff v3 §11: Portuguese → English slugs; later renames and merges).
// Only for entity pages whose slug is not a current one; one indexed query on slug_redirects.
import { active, athletes, slugRedirects, sports } from '@was/db';
import { eq } from 'drizzle-orm';
import type { Hono } from 'hono';

import type { AppDeps, HonoEnv } from '../http/app-context.type';

type SluggedTable = typeof sports | typeof athletes;
const PAGES: { prefix: string; table: SluggedTable; entityType: 'sport' | 'competitor' }[] = [
  { prefix: '/sports/', table: sports, entityType: 'sport' },
  { prefix: '/athletes/', table: athletes, entityType: 'competitor' },
];

/** Current slug for an old one, or null when the slug is current or unknown. */
export const resolveSlugRedirect = async (deps: AppDeps, entityType: 'sport' | 'competitor', slug: string, table: SluggedTable): Promise<string | null> => {
  const [current] = await deps.db.select({ id: table.id }).from(table).where(active(table, eq(table.slug, slug))).limit(1);
  if (current) return null;
  const [hit] = await deps.db
    .select({ slug: table.slug })
    .from(slugRedirects)
    .innerJoin(table, eq(table.id, slugRedirects.entityId))
    .where(active(slugRedirects, eq(slugRedirects.entityType, entityType), eq(slugRedirects.oldSlug, slug)))
    .limit(1);
  return hit?.slug ?? null;
};

export const mountSlugRedirects = (app: Hono<HonoEnv>, deps: AppDeps): void => {
  app.get('*', async (c, next) => {
    const page = PAGES.find((p) => c.req.path.startsWith(p.prefix) && c.req.path.split('/').length === 3);
    const slug = page ? decodeURIComponent(c.req.path.slice(page.prefix.length)) : '';
    const target = page && slug ? await resolveSlugRedirect(deps, page.entityType, slug, page.table) : null;
    if (!page || !target) return next();
    return c.redirect(`${page.prefix}${encodeURIComponent(target)}${new URL(c.req.url).search}`, 301);
  });
};
