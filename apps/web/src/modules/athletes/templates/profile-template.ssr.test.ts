// T2.8: every sport template renders on the server (fixture mode) with its own blocks and no axe violations.
import axe from 'axe-core';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

import { render } from '@/app/entry-server';

const ssrHtml = async (path: string) => {
  const response = await render({
    request: new Request(`http://localhost:8787${path}`, { headers: { cookie: 'was_fixture=sample' } }),
    nonce: 'templates',
    apiFetch: () => Promise.reject(new Error('fixture mode never calls the API')),
    timeZone: 'America/Sao_Paulo',
    publicUrl: 'https://worldallstars.example',
    assets: { scripts: [], css: [], preloads: [], routeChunks: {} },
  });
  return { status: response.status, html: await response.text() };
};

const violations = async (html: string) => {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:8787/' });
  dom.window.eval(axe.source);
  const run = (dom.window as unknown as { axe: typeof axe }).axe;
  const result = await run.run(dom.window.document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  dom.window.close();
  return result.violations.map((v) => ({ rule: v.id, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }));
};

/** One fixture athlete per template (no fixture athlete is an Ironman: the registry test covers that mapping). */
const CASES: [template: string, slug: string, marker: string][] = [
  ['football', 'pele', 'Rankings'],
  ['bjj', 'roger-gracie', 'Faixa, modalidade e divisões'],
  ['boxing', 'mike-tyson', 'Rankings'],
  ['olympic', 'michael-phelps', 'Medalhas olímpicas'],
  ['chess', 'magnus-carlsen', 'Rankings'],
  ['fallback', 'faker', 'Rankings'],
];

describe('sport profile templates (SSR + axe)', { timeout: 20_000 }, () => {
  it.each(CASES)('%s template (%s) renders its blocks without axe violations', async (_template, slug, marker) => {
    const { status, html } = await ssrHtml(`/athletes/${slug}`);
    expect(status).toBe(200);
    expect(html).toContain(marker);
    expect(await violations(html)).toEqual([]);
  });
});
