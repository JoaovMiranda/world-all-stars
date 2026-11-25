// T3.4: `/compare?a=&b=` renders the head-to-head on the server (fixture mode) and is never indexed (axe: app/a11y.test.ts).
import { describe, expect, it } from 'vitest';

import { render } from '@/app/entry-server';

const page = async (search: string) => {
  const response = await render({
    request: new Request(`http://localhost:8787/compare${search}`, { headers: { cookie: 'was_fixture=sample' } }),
    nonce: 'compare',
    apiFetch: () => Promise.reject(new Error('fixture mode never calls the API')),
    timeZone: 'America/Sao_Paulo',
    publicUrl: 'https://worldallstars.example',
    assets: { scripts: [], css: [], preloads: [], routeChunks: {} },
  });
  return { status: response.status, html: await response.text() };
};

describe('compare page (SSR)', { timeout: 20_000 }, () => {
  it('renders both competitors side by side with row and column headers', async () => {
    const { status, html } = await page('?a=pele&b=michael-phelps');
    expect(status).toBe(200);
    expect(html).toContain('Comparação entre Pelé e Michael Phelps');
    expect(html).toContain('scope="row"');
    expect(html).toContain('Faixa entre esportes');
    // Different sports: no methodology scores side by side.
    expect(html).toContain('esportes diferentes: pontuações de metodologia não são comparadas');
  });

  it('is noindex, without canonical or JSON-LD', async () => {
    const { html } = await page('?a=pele&b=neymar');
    expect(html).toMatch(/<meta[^>]*name="robots"[^>]*content="noindex"/);
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('application/ld+json');
  });

  it('asks for a pair when the URL has none or the same competitor twice', async () => {
    expect((await page('')).html).toContain('Escolha dois competidores para ver a comparação lado a lado.');
    expect((await page('?a=pele&b=pele')).html).toContain('Escolha dois competidores diferentes.');
  });

  it('shows not found for an unknown competitor', async () => {
    expect((await page('?a=pele&b=nobody-here')).html).toContain('Competidor não encontrado');
  });
});
