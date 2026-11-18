// SSR smoke test (fixture data committed in src/fixtures/sample): the server renders real pages, with the data
// dehydrated for hydration and the CSP nonce on every script. Runs in CI without plan/.
import { describe, expect, it } from 'vitest';

import sessionUsers from '@/fixtures/sample/session-users.json';

import { render } from './entry-server';

const NONCE = 'test-nonce-123';

const ROUTE_CHUNK = '/assets/athlete-profile.page.js';

const ssr = async (path: string, cookie = '') => {
  const response = await render({
    request: new Request(`http://localhost:8787${path}`, { headers: { cookie: `was_fixture=sample${cookie ? `; ${cookie}` : ''}` } }),
    nonce: NONCE,
    apiFetch: () => Promise.reject(new Error('fixture mode never calls the API')),
    timeZone: 'America/Sao_Paulo',
    publicUrl: 'https://worldallstars.example',
    assets: {
      scripts: [{ attrs: { type: 'module', src: '/assets/entry-client.js' } }],
      css: ['/assets/style.css'],
      preloads: [],
      routeChunks: { 'src/modules/athletes/athlete-profile.page.tsx': [ROUTE_CHUNK] },
    },
  });
  return { status: response.status, html: await response.text(), headers: response.headers };
};

const scriptTags = (html: string) => html.match(/<script\b[^>]*>/g) ?? [];
/** Every JSON-LD node of a page (parsed: invalid JSON fails the test). */
const jsonLd = (html: string): Record<string, any>[] =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(([, json]) => JSON.parse(json ?? ''));
const ofType = (html: string, type: string) => jsonLd(html).find((n) => n['@type'] === type);

describe('server render (entry-server)', () => {
  it.each([
    ['/', /<h1[^>]*>/],
    ['/athletes/pele', /<h1[^>]*>Pelé/],
    ['/sports/futebol', /<h1[^>]*>[^<]*Futebol/],
  ])('%s → 200 with content, dehydrated state and nonce on every script', async (path, h1) => {
    const { status, html, headers } = await ssr(path);
    expect(status).toBe(200);
    expect(headers.get('content-type')).toContain('text/html');
    expect(html.startsWith('<!DOCTYPE html><html lang="pt-BR"')).toBe(true);
    expect(html).toMatch(h1);
    expect(html).not.toContain('<!--$!-->'); // no Suspense boundary fell back to client rendering

    expect(html).toContain('$_TSR');
    expect(html).toContain('/assets/entry-client.js');
    expect(html).toContain('href="/assets/style.css"');
    const scripts = scriptTags(html);
    expect(scripts.length).toBeGreaterThan(1);
    for (const tag of scripts) expect(tag).toContain(`nonce="${NONCE}"`);
  });

  it('puts the page head (title, description, canonical) in the HTML', async () => {
    const { html } = await ssr('/athletes/pele');
    expect(html).toContain('<title>Pelé · World All Stars</title>');
    expect(html).toContain('<link rel="canonical" href="https://worldallstars.example/athletes/pele"');
    expect(html).toMatch(/<meta name="description" content="Pelé \(/);
  });

  it('answers 404 with its own title, noindex and no canonical (unknown athlete, sport and route)', async () => {
    for (const path of ['/athletes/nao-existe', '/sports/nao-existe', '/rota/que/nao/existe']) {
      const { status, html } = await ssr(path);
      expect(status, path).toBe(404);
      expect(html, path).toContain('<title>Página não encontrada · World All Stars</title>');
      expect(html, path).toContain('<meta name="robots" content="noindex"');
      expect(html, path).not.toContain('rel="canonical"');
    }
  });

  it('preloads the page chunk of the matched route only', async () => {
    expect((await ssr('/athletes/pele')).html).toMatch(new RegExp(`<link rel="modulepreload" href="${ROUTE_CHUNK}"`));
    expect((await ssr('/sports')).html).not.toContain(ROUTE_CHUNK);
  });

  it('emits valid JSON-LD (nonce included) on home, profile, sport and lists', async () => {
    const home = (await ssr('/')).html;
    expect(ofType(home, 'WebSite')?.potentialAction.target.urlTemplate).toBe('https://worldallstars.example/athletes?q={search_term_string}');
    expect(ofType(home, 'Organization')?.name).toBe('World All Stars');

    const profile = (await ssr('/athletes/pele')).html;
    const person = ofType(profile, 'ProfilePage')?.mainEntity;
    expect(person).toMatchObject({ '@type': 'Person', name: 'Pelé', url: 'https://worldallstars.example/athletes/pele', birthDate: '1940-10-23' });
    expect(person.image).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
    expect(person.nationality).toContainEqual({ '@type': 'Country', name: 'Brasil' });
    expect(person.sameAs).toContain('https://www.wikidata.org/wiki/Q12897');
    expect(person.award.some((a: string) => a.startsWith('Copa do Mundo FIFA'))).toBe(true);
    expect(person.memberOf).toContainEqual({ '@type': 'SportsTeam', name: 'Santos' });
    const crumbs = ofType(profile, 'BreadcrumbList')?.itemListElement;
    expect(crumbs.map((c: { position: number }) => c.position)).toEqual([1, 2, 3, 4]);
    expect(crumbs.at(-1).name).toBe('Pelé');
    expect(profile).toContain('<meta property="og:image" content="https://upload.wikimedia.org/');

    const sport = (await ssr('/sports/futebol')).html;
    expect(ofType(sport, 'CollectionPage')?.about).toMatchObject({ '@type': 'Thing', name: 'Futebol' });
    expect(ofType(sport, 'CollectionPage')?.mentions.some((o: { '@type': string; name: string }) => o['@type'] === 'SportsOrganization' && o.name === 'FIFA')).toBe(true);
    expect(ofType(sport, 'BreadcrumbList')).toBeDefined();

    for (const path of ['/athletes', '/hall-of-greats', '/sports']) {
      const list = ofType((await ssr(path)).html, 'ItemList');
      expect(list?.itemListElement.length, path).toBeGreaterThan(0);
      expect(list?.itemListElement[0].url, path).toMatch(/^https:\/\/worldallstars\.example\//);
    }
    for (const tag of profile.match(/<script type="application\/ld\+json"[^>]*>/g) ?? []) expect(tag).toContain(`nonce="${NONCE}"`);
  });

  it('redirects the old routes', async () => {
    const { status, headers } = await ssr('/calendar');
    expect(status).toBeGreaterThanOrEqual(300);
    expect(status).toBeLessThan(400);
    expect(headers.get('location')).toContain('/');
  });

  it('renders the session from the cookie / ?as= (same rule as the API)', async () => {
    const { html } = await ssr('/?as=admin');
    expect(html).toContain('sessionKind:"admin"'); // boot serialized by the router (seroval: unquoted keys)
  });

  it('renders the signed-in header (account menu with the first name) when a session cookie is present', async () => {
    const reader = sessionUsers.reader.name.split(' ')[0] ?? '';
    const signedIn = (await ssr('/athletes', 'was_session=reader')).html;
    expect(signedIn).toMatch(new RegExp(`class="[^"]*session-btn[^"]*"[^>]*>${reader}`));
    const visitor = (await ssr('/athletes')).html;
    expect(visitor).not.toMatch(new RegExp(`session-btn[^"]*"[^>]*>${reader}`));
  });
});
