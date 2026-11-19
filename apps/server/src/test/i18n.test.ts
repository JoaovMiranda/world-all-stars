// Same-URL i18n (doc 12): the API answers in the request locale (x-was-locale → cookie → Accept-Language → pt-BR),
// content falls back to the English source (then pt-BR) with `contentLocale`, and anonymous pages are cached per language.
import { createDatabase, type DatabaseHandle } from '@was/db';
import { API_ERROR_MESSAGES, LOCALE_COOKIE, ORG_LABELS_MESSAGES, LOCALE_HEADER, ParticipationApi, PublicApi, VALIDATION_MESSAGES, buildApiPath, resolveLocale, textFor } from '@was/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';
import { PUBLIC_HTML_CACHE_CONTROL } from '../web/html-cache';
import type { WebRuntime } from '../web/web-handler';
import { HAS_PROTOTYPE, createTestApp, type TestApp } from './test-app.helper';

const readCookie = (header: string | null, name: string) =>
  header
    ?.split(';')
    .map((p) => p.trim().split('='))
    .find(([k]) => k === name)?.[1];

const EMPTY = { name: '', email: 'x', topic: 'nope', body: ' ' };

describe('API in the request locale', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp({ seed: HAS_PROTOTYPE });
  });
  afterAll(() => t.close());

  const post = (body: unknown, headers: Record<string, string>) =>
    t.app.request(ParticipationApi.submitContact.path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

  it('422 field errors and message come in English with x-was-locale: en', async () => {
    const res = await post(EMPTY, { [LOCALE_HEADER]: 'en' });
    expect(res.status).toBe(422);
    expect(res.headers.get('content-language')).toBe('en');
    const json = (await res.json()) as { message: string; errors: Record<string, string> };
    const en = textFor(VALIDATION_MESSAGES, 'en');
    expect(json.message).toBe(textFor(API_ERROR_MESSAGES, 'en').checkFields);
    expect(json.errors.name).toBe(en.contactNameRequired);
    expect(json.errors.email).toBe(en.contactEmailRequired);
    expect(json.errors.body).toBe(en.contactBodyEmpty);
  });

  it('cookie and Accept-Language pick the locale when there is no header; pt-BR otherwise', async () => {
    const es = await post(EMPTY, { cookie: `${LOCALE_COOKIE}=es`, 'accept-language': 'en' });
    expect(((await es.json()) as { errors: Record<string, string> }).errors.name).toBe(textFor(VALIDATION_MESSAGES, 'es').contactNameRequired);
    const en = await post(EMPTY, { 'accept-language': 'en-GB,en;q=0.9' });
    expect(en.headers.get('content-language')).toBe('en');
    const pt = await post(EMPTY, {});
    expect(pt.headers.get('content-language')).toBe('pt-BR');
    expect(((await pt.json()) as { errors: Record<string, string> }).errors.name).toBe(VALIDATION_MESSAGES['pt-BR'].contactNameRequired);
  });

  it('generic Zod messages of the contract schemas (malformed body) follow the locale (en, es)', async () => {
    // Wrong types: no shared validator runs, only the contract schema → zodErrorMap of the request locale.
    const malformed = { name: 42, topic: 'nope', body: 7 };
    for (const locale of ['en', 'es'] as const) {
      const res = await post(malformed, { [LOCALE_HEADER]: locale });
      expect(res.status).toBe(422);
      const { errors } = (await res.json()) as { errors: Record<string, string> };
      const m = textFor(VALIDATION_MESSAGES, locale);
      expect(errors.name).toBe(m.schema.invalid);
      expect(errors.email).toBe(m.required);
      expect(errors.body).toBe(m.schema.invalid);
    }
  });

  it('404 and 401 messages follow the locale', async () => {
    const missing = await t.app.request('/api/nao-existe', { headers: { [LOCALE_HEADER]: 'es' } });
    expect(((await missing.json()) as { message: string }).message).toBe(textFor(API_ERROR_MESSAGES, 'es').notFound);
    const me = await t.app.request('/api/me', { headers: { [LOCALE_HEADER]: 'en' } });
    expect(me.status).toBe(401);
    expect(((await me.json()) as { message: string }).message).toBe(textFor(API_ERROR_MESSAGES, 'en').signIn);
  });

  it.skipIf(!HAS_PROTOTYPE)('athlete content is English at the source; a missing translation falls back to it and says so (contentLocale)', async () => {
    const path = buildApiPath(PublicApi.athleteProfile.path, { slug: 'pele' });
    const en = (await (await t.app.request(path, { headers: { [LOCALE_HEADER]: 'en' } })).json()) as { contentLocale?: string; knownAs: string };
    expect(en.knownAs).toBe('Pelé');
    expect(en.contentLocale).toBe('en');
    const pt = (await (await t.app.request(path)).json()) as { contentLocale?: string };
    expect(pt.contentLocale).toBe('pt-BR');
    // No Spanish bio yet: the English source answers and the response says so.
    const es = (await (await t.app.request(path, { headers: { [LOCALE_HEADER]: 'es' } })).json()) as { contentLocale?: string };
    expect(es.contentLocale).toBe('en');
  });

  it.skipIf(!HAS_PROTOTYPE)('organization labels come in the request locale', async () => {
    const tree = (await (await t.app.request(PublicApi.organizations.path, { headers: { [LOCALE_HEADER]: 'en' } })).json()) as { natureLabel: string }[];
    const labels = new Set(tree.map((o) => o.natureLabel));
    expect(labels.size).toBeGreaterThan(0);
    expect([...labels].every((l) => Object.values(textFor(ORG_LABELS_MESSAGES, 'en').nature).includes(l))).toBe(true);
  });
});

describe('anonymous pages cached per language', () => {
  let handle: DatabaseHandle;
  let created: ReturnType<typeof createApp>;
  let renders = 0;

  beforeAll(async () => {
    handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    const web: WebRuntime = {
      dev: false,
      assets: async () => ({ scripts: [], css: [], preloads: [] }),
      loadRenderer: async () => ({
        async render({ request, nonce }) {
          renders += 1;
          const lang = resolveLocale({ cookie: readCookie(request.headers.get('cookie'), LOCALE_COOKIE), acceptLanguage: request.headers.get('accept-language') });
          return new Response(`<!DOCTYPE html><html lang="${lang}"><body><script nonce="${nonce}"></script></body></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=UTF-8' } });
        },
      }),
    };
    created = createApp({ db: handle.db, config: { ...loadConfig({}), logRequests: false }, web });
  });
  afterAll(() => handle.close());

  it('pt and en anonymous requests get different bodies and ETags, and the cache never mixes them', async () => {
    created.htmlCache.clear();
    const app = created.app;
    const before = renders;
    const pt = await app.request('/athletes');
    const en = await app.request('/athletes', { headers: { 'accept-language': 'en-US,en;q=0.9' } });
    expect(pt.headers.get('content-language')).toBe('pt-BR');
    expect(en.headers.get('content-language')).toBe('en');
    expect(en.headers.get('vary')).toBe('Cookie, Accept-Language, Accept-Encoding'); // + compression middleware
    expect(en.headers.get('cache-control')).toBe(PUBLIC_HTML_CACHE_CONTROL);
    expect(await pt.text()).toContain('lang="pt-BR"');
    expect(await en.text()).toContain('lang="en"');
    expect(pt.headers.get('etag')).not.toBe(en.headers.get('etag'));
    expect(renders - before).toBe(2);

    // Both come from the cache now, each in its own language.
    const enAgain = await app.request('/athletes', { headers: { 'accept-language': 'en' } });
    const ptAgain = await app.request('/athletes', { headers: { 'accept-language': 'pt-BR' } });
    expect(renders - before).toBe(2);
    expect(enAgain.headers.get('etag')).toBe(en.headers.get('etag'));
    expect(await ptAgain.text()).toContain('lang="pt-BR"');
  });

  it('the was_locale cookie is a cacheable variant, not a personal one', async () => {
    created.htmlCache.clear();
    const es = await created.app.request('/sports', { headers: { cookie: `${LOCALE_COOKIE}=es`, 'accept-language': 'en' } });
    expect(es.headers.get('cache-control')).toBe(PUBLIC_HTML_CACHE_CONTROL);
    expect(es.headers.get('content-language')).toBe('es');
    expect(await es.text()).toContain('lang="es"');
    expect(created.htmlCache.size).toBe(1);
  });
});
