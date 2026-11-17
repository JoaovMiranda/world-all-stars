// SSR smoke test (fixture data committed in src/fixtures/sample): the server renders real pages, with the data
// dehydrated for hydration and the CSP nonce on every script. Runs in CI without plan/.
import { describe, expect, it } from 'vitest';

import { render } from './entry-server';

const NONCE = 'test-nonce-123';

const ssr = async (path: string) => {
  const response = await render({
    request: new Request(`http://localhost:8787${path}`, { headers: { cookie: 'was_fixture=sample' } }),
    nonce: NONCE,
    apiFetch: () => Promise.reject(new Error('fixture mode never calls the API')),
    timeZone: 'America/Sao_Paulo',
    publicUrl: 'https://worldallstars.example',
    assets: { scripts: [{ attrs: { type: 'module', src: '/assets/entry-client.js' } }], css: ['/assets/style.css'], preloads: [] },
  });
  return { status: response.status, html: await response.text(), headers: response.headers };
};

const scriptTags = (html: string) => html.match(/<script\b[^>]*>/g) ?? [];

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

  it('answers 404 for an unknown athlete and an unknown route', async () => {
    expect((await ssr('/athletes/nao-existe')).status).toBe(404);
    expect((await ssr('/rota/que/nao/existe')).status).toBe(404);
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
});
