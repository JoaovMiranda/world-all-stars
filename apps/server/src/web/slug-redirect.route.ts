// Old slugs answer 301 to the current URL (handoff v3 §11: Portuguese → English slugs; later renames and merges).
// Only for entity pages whose slug is not a current one; one indexed query on slug_redirects.
import type { Hono } from 'hono';

import type { HonoEnv } from '../http/app-context.type';
import type { AppDeps } from '../http/app-deps.interface';
import { SLUG_REDIRECT_PAGES } from './slug-redirect.const';
import { resolveSlugRedirect } from './slug-redirect.helper';

export const mountSlugRedirects = (app: Hono<HonoEnv>, deps: AppDeps): void => {
  app.get('*', async (c, next) => {
    const page = SLUG_REDIRECT_PAGES.find((p) => c.req.path.startsWith(p.prefix) && c.req.path.split('/').length === 3);
    const slug = page ? decodeURIComponent(c.req.path.slice(page.prefix.length)) : '';
    const target = page && slug ? await resolveSlugRedirect(deps, page.entityType, slug, page.table) : null;
    if (!page || !target) return next();
    return c.redirect(`${page.prefix}${encodeURIComponent(target)}${new URL(c.req.url).search}`, 301);
  });
};
