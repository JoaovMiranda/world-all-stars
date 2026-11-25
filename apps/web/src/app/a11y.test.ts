// Accessibility gate (WCAG 2.2 A + AA, axe-core) over the server-rendered HTML of every public page, in fixture mode.
// jsdom has no layout, so `color-contrast` is checked by Lighthouse and by the theme token test instead
// (theme-contrast.test.ts). Behaviour after hydration (focus, keyboard) has its own tests.
import axe from 'axe-core';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

import { render } from './entry-server';

const ssrHtml = async (path: string, cookie = '') => {
  const response = await render({
    request: new Request(`http://localhost:8787${path}`, { headers: { cookie: `was_fixture=sample${cookie ? `; ${cookie}` : ''}` } }),
    nonce: 'a11y',
    apiFetch: () => Promise.reject(new Error('fixture mode never calls the API')),
    timeZone: 'America/Sao_Paulo',
    publicUrl: 'https://worldallstars.example',
    assets: { scripts: [], css: [], preloads: [], routeChunks: {} },
  });
  return { status: response.status, html: await response.text() };
};

const audit = async (html: string) => {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:8787/' });
  dom.window.eval(axe.source);
  const run = (dom.window as unknown as { axe: typeof axe }).axe;
  const result = await run.run(dom.window.document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    rules: {
      'color-contrast': { enabled: false },
      // Decorative motion and layout regions are covered by other checks; axe's region rule needs real CSS.
      region: { enabled: false },
    },
  });
  dom.window.close();
  return result.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }));
};

const PUBLIC_PAGES = [
  '/',
  '/athletes',
  '/athletes?sport=football',
  '/athletes/pele',
  '/athletes/pele?tab=comments',
  '/athletes/pele?tab=analysis',
  '/hall-of-greats',
  '/compare',
  '/compare?a=pele&b=michael-phelps',
  '/compare?a=pele&b=neymar',
  '/sports',
  '/sports/football',
  '/sources',
  '/contact',
  '/on-this-day/07-20',
  '/about/criteria',
  '/accessibility',
  '/rankings/football-champions/methodology',
  '/rankings/boxing/methodology',
  '/legal/privacy',
  '/legal/terms',
  '/legal/cookies',
  '/this-page-does-not-exist',
];

// The first SSR render warms the module graph and can exceed the 5 s default when every package's suite runs in parallel.
describe('accessibility of the server-rendered pages (axe, WCAG 2.2 AA)', { timeout: 20_000 }, () => {
  it.each(PUBLIC_PAGES)('%s has no axe violations', async (path) => {
    const { html } = await ssrHtml(path);
    expect(await audit(html)).toEqual([]);
  });

  it.each(['en', 'es'].flatMap((l) => ['/', '/athletes/pele', '/rankings/bjj-career/methodology'].map((p) => [l, p])))('%s %s has no axe violations', async (locale, path) => {
    const { html } = await ssrHtml(path, `was_locale=${locale}`);
    expect(await audit(html)).toEqual([]);
  });
});
