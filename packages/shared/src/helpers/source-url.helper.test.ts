import { describe, expect, it } from 'vitest';

import { SOURCES_FIXTURE } from '../test/moderation.fixture';
import { checkSourceUrl } from './source-url.helper';

const check = (raw: string) => checkSourceUrl(raw, SOURCES_FIXTURE);

describe('checkSourceUrl (doc 21)', () => {
  it('refuses text that is not a link', () => {
    expect(check('pele wikipedia')).toMatchObject({ ok: false, error: 'invalid_url' });
  });
  it('requires https', () => {
    expect(check('http://en.wikipedia.org/wiki/Pel%C3%A9')).toMatchObject({ ok: false, error: 'not_https' });
    expect(check('ftp://example.com')).toMatchObject({ ok: false, error: 'not_https' });
  });
  it.each([
    'https://localhost/x',
    'https://127.0.0.1/admin',
    'https://192.168.0.10',
    'https://10.0.0.1',
    'https://[::1]/',
    'https://2130706433/',
    'https://0x7f.0.0.1/',
    'https://intranet/',
    'https://printer.local/',
    'https://user:pass@example.com/',
  ])('refuses forbidden host %s (anti-SSRF)', (raw) => {
    expect(check(raw)).toMatchObject({ ok: false, error: 'forbidden_host' });
  });
  it('refuses rejected sources (also subdomains and www)', () => {
    expect(check('https://allsportdb.com/athletes/1')).toMatchObject({ ok: false, error: 'rejected_source' });
    expect(check('https://www.rdy.gg/player/x')).toMatchObject({ ok: false, error: 'rejected_source' });
  });
  it('accepts link-only sources with a note', () => {
    const result = check('https://boxrec.com/en/proboxer/474');
    expect(result).toMatchObject({ ok: true, source: { name: 'BoxRec', usageStatus: 'link_only' } });
    expect(result.ok && result.note).toContain('BoxRec');
  });
  it('accepts active and unknown sources without a note', () => {
    expect(check(' https://en.wikipedia.org/wiki/Pel%C3%A9 ')).toMatchObject({ ok: true, note: null, source: { name: 'Wikipedia (en)' } });
    expect(check('https://www.example-news.com/a')).toMatchObject({ ok: true, source: null, note: null });
  });
});
