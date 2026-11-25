// T4.2: public methodology pages render on the server (fixture mode) from the real METHODOLOGY.md files, sanitized,
// with the untranslated note outside English (axe runs over the same paths in app/a11y.test.ts).
import { describe, expect, it } from 'vitest';

import { render } from '@/app/entry-server';
import { FIXTURE_METHODOLOGY_SOURCES } from '@/data/fixtures/methodology-fixture.const';

const ssr = async (path: string, locale = 'pt-BR') => {
  const response = await render({
    request: new Request(`http://localhost:8787${path}`, { headers: { cookie: `was_fixture=sample; was_locale=${locale}` } }),
    nonce: 'methodology',
    apiFetch: () => Promise.reject(new Error('fixture mode never calls the API')),
    timeZone: 'America/Sao_Paulo',
    publicUrl: 'https://worldallstars.example',
    assets: { scripts: [], css: [], preloads: [], routeChunks: {} },
  });
  return { status: response.status, html: await response.text() };
};

const KEYS = Object.keys(FIXTURE_METHODOLOGY_SOURCES);

describe('methodology pages (SSR)', { timeout: 20_000 }, () => {
  it('bundles the METHODOLOGY.md of every methodology for fixture mode', () => {
    expect(KEYS.sort()).toEqual(['bjj-career', 'boxing', 'chess-classical', 'football-champions', 'ironman', 'olympic-medals']);
  });

  it.each(KEYS)('/rankings/%s/methodology renders the document', async (key) => {
    const { status, html } = await ssr(`/rankings/${key}/methodology`);
    expect(status).toBe(200);
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toContain('class="doc-section"');
    expect(html).toContain('lang="en"');
  });

  it('renders tables, code and the version from the markdown, and no raw HTML from it', async () => {
    const { html } = await ssr('/rankings/football-champions/methodology', 'en');
    expect(html).toContain('<table class="table">');
    expect(html).toContain('<code>world-cup-men</code>');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('untranslated-note');
  });

  it('shows the untranslated note in pt-BR and es', async () => {
    for (const locale of ['pt-BR', 'es']) expect((await ssr('/rankings/boxing/methodology', locale)).html).toContain('untranslated-note');
  });

  it('404 for an unknown methodology, while /rankings/all-sports/methodology keeps its own page', async () => {
    expect((await ssr('/rankings/nothing/methodology')).status).toBe(404);
    const allSports = await ssr('/rankings/all-sports/methodology');
    expect(allSports.status).toBe(200);
    expect(allSports.html).not.toContain('class="doc-section"');
  });
});
