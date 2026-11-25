// T4.2: methodology documents are read once from METHODOLOGY*.md, parsed into sanitized blocks and served by key.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { METHODOLOGIES } from '@was/ranking';
import { MethodologyApi, MethodologyDocResponseSchema } from '@was/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HAS_PROTOTYPE } from '../../test/test-app.const';
import { createTestApp } from '../../test/test-app.helper';
import type { TestApp } from '../../test/test-app.interface';
import { MethodologyDocsStore } from './methodology-docs.store';
import { resolveMethodologyDocsDir } from './methodology-docs-dir.helper';

describe('methodology documents store', () => {
  it('finds the sources folder and parses a METHODOLOGY.md for every registered methodology', () => {
    const store = new MethodologyDocsStore(resolveMethodologyDocsDir({}));
    expect(store.keys().sort()).toEqual(Object.keys(METHODOLOGIES).sort());
    for (const key of store.keys()) {
      const doc = store.get(key, 'en');
      expect(doc?.locale).toBe('en');
      expect(doc?.document.title).toBeTruthy();
      expect(doc?.document.blocks.length).toBeGreaterThan(0);
    }
  });

  it('serves a translation when it exists and falls back to English otherwise', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'was-methodology-'));
    try {
      fs.mkdirSync(path.join(dir, 'boxing'));
      fs.writeFileSync(path.join(dir, 'boxing', 'METHODOLOGY.md'), '# Boxing\n\nEnglish <script>x</script>');
      fs.writeFileSync(path.join(dir, 'boxing', 'METHODOLOGY.es.md'), '# Boxeo\n\nEspañol');
      const store = new MethodologyDocsStore(dir, ['boxing', 'chess-classical']);
      expect(store.get('boxing', 'es')).toMatchObject({ locale: 'es', document: { title: 'Boxeo' } });
      expect(store.get('boxing', 'pt-BR')).toMatchObject({ locale: 'en', document: { title: 'Boxing' } });
      expect(store.get('boxing', 'en')?.document.blocks).toEqual([{ kind: 'paragraph', content: [{ kind: 'text', text: 'English <script>x</script>' }] }]);
      expect(store.get('chess-classical', 'en')).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('honours METHODOLOGY_DOCS_DIR', () => {
    expect(resolveMethodologyDocsDir({ METHODOLOGY_DOCS_DIR: '/srv/docs' })).toBe('/srv/docs');
  });
});

describe.skipIf(!HAS_PROTOTYPE)('GET /api/ranking-methodologies/:key', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  }, 120_000);
  afterAll(() => t.close());

  it('returns the parsed document with the registry metadata', async () => {
    const res = await t.call(MethodologyApi.doc, { params: { key: 'football-champions' } });
    expect(res.status).toBe(200);
    expect(MethodologyDocResponseSchema.safeParse(res.json).success).toBe(true);
    expect(res.json.key).toBe('football-champions');
    expect(res.json.rankings.length).toBeGreaterThan(0);
    expect(res.json.blocks.some((b: { kind: string }) => b.kind === 'table')).toBe(true);
  });

  it('404 for an unknown or malformed key', async () => {
    expect((await t.call(MethodologyApi.doc, { params: { key: 'nothing' } })).status).toBe(404);
    expect((await t.call(MethodologyApi.doc, { params: { key: 'constructor' } })).status).toBe(404);
    expect((await t.call(MethodologyApi.doc, { params: { key: 'Bad Key' } })).status).toBe(422);
  });
});
