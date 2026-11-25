// T4.1: competition and edition pages render on the server (fixture mode) in every language, with SportsEvent /
// EventSeries JSON-LD, hidden empty sections, a 404 for unknown editions and no axe violations (WCAG 2.2 AA).
import axe from 'axe-core';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

import { render } from '@/app/entry-server';

const ssr = async (path: string, locale = 'pt-BR') => {
  const response = await render({
    request: new Request(`http://localhost:8787${path}`, { headers: { cookie: `was_fixture=sample; was_locale=${locale}` } }),
    nonce: 'competitions',
    apiFetch: () => Promise.reject(new Error('fixture mode never calls the API')),
    timeZone: 'America/Sao_Paulo',
    publicUrl: 'https://worldallstars.example',
    assets: { scripts: [], css: [], preloads: [], routeChunks: {} },
  });
  return { status: response.status, html: await response.text() };
};

const axeViolations = async (html: string) => {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:8787/' });
  dom.window.eval(axe.source);
  const result = await (dom.window as unknown as { axe: typeof axe }).axe.run(dom.window.document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  dom.window.close();
  return result.violations.map((v) => ({ rule: v.id, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }));
};

const jsonLdTypes = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => (JSON.parse(m[1]!) as { '@type': string })['@type']);

describe('competition and edition pages (SSR + axe)', { timeout: 30_000 }, () => {
  it.each([
    ['/competitions/fifa-world-cup', 'EventSeries', 'Copa do Mundo FIFA'],
    ['/competitions/fifa-world-cup/1958', 'SportsEvent', 'Elencos'],
    ['/competitions/olympic-swimming/2008', 'SportsEvent', 'Quadro de medalhas'],
  ])('%s renders with JSON-LD %s and no axe violations', async (path, type, marker) => {
    const { status, html } = await ssr(path);
    expect(status).toBe(200);
    expect(html).toContain(marker);
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(jsonLdTypes(html)).toEqual(expect.arrayContaining([type, 'BreadcrumbList']));
    expect(await axeViolations(html)).toEqual([]);
  });

  it('a single-event edition hides the medal table and the lineup block', async () => {
    const { html } = await ssr('/competitions/fifa-world-cup/1958');
    expect(html).not.toContain('Quadro de medalhas');
    expect(html).not.toContain('Escalação da final');
  });

  it.each([
    ['en', 'Editions'],
    ['es', 'Ediciones'],
  ])('renders in %s without axe violations', async (locale, marker) => {
    const { status, html } = await ssr('/competitions/fifa-world-cup', locale);
    expect(status).toBe(200);
    expect(html).toContain(marker);
    expect(await axeViolations(html)).toEqual([]);
  });

  it('an unknown edition is a 404', async () => {
    expect((await ssr('/competitions/fifa-world-cup/1800')).status).toBe(404);
  });
});
