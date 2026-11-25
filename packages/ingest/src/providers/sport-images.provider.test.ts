import type { SportImage, SportImagesFile } from '@was/db';
import type { WikidataEntity } from '@was/shared';
import { describe, expect, it, vi } from 'vitest';

import type { CommonsImageInfo } from '../interfaces/commons-image-info.interface';
import type { IngestContext } from './ingest-context.interface';
import { authorCredit, commonsFileKey, htmlToText, imageCandidates, isSportImage, itemMatchesSport, pickSportImage } from './sport-image.helper';
import { SportImagesProvider } from './sport-images.provider';
import { sportImagesReview } from './sport-images-review.helper';

const info = (license: string, artist = '<a href="//commons.wikimedia.org/wiki/User:Jane">Jane &amp; Co</a>'): CommonsImageInfo => ({
  url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Ball.jpg',
  thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Ball.jpg/1280px-Ball.jpg',
  descriptionurl: 'https://commons.wikimedia.org/wiki/File:Ball.jpg',
  extmetadata: {
    LicenseShortName: { value: license },
    LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' },
    Artist: { value: artist },
    DateTimeOriginal: { value: '2014-06-12 18:00' },
  },
});

const entity = (files: [string, 'preferred' | 'normal' | 'deprecated'][]): WikidataEntity =>
  ({ id: 'Q2736', claims: { P18: files.map(([value, rank]) => ({ rank, mainsnak: { datavalue: { value } } })) } }) as WikidataEntity;

describe('sport image helpers', () => {
  it('reads P18 preferred first and drops deprecated statements', () => {
    expect(
      imageCandidates(
        entity([
          ['B.jpg', 'normal'],
          ['A.jpg', 'preferred'],
          ['C.jpg', 'deprecated'],
        ]),
      ),
    ).toEqual(['A.jpg', 'B.jpg']);
    expect(imageCandidates(undefined)).toEqual([]);
  });

  it('normalizes Commons file names and extmetadata HTML', () => {
    expect(commonsFileKey('File:football_match.jpg')).toBe('Football match.jpg');
    expect(htmlToText('<span>&#169;&#x20;Jane&nbsp;X</span>')).toBe('\u00a9 Jane X');
    expect(htmlToText('<b> </b>')).toBeNull();
  });

  it('shortens Commons author boilerplate', () => {
    expect(authorCredit('No machine-readable author provided. Chauki assumed (based on copyright claims).')).toBe('Chauki');
    expect(authorCredit(null, 'Credit line')).toBe('Credit line');
    const long = `Photo by the Navy. ${'This tag does not indicate the copyright status. '.repeat(5)}`;
    expect(authorCredit(long)!.length).toBeLessThanOrEqual(120);
  });

  it('detects a QID that is another thing than the sport (sitelink, else labels)', () => {
    const judo = { id: 'Q11420', sitelinks: { enwiki: { title: 'Judo' } }, labels: { en: { value: 'judo' } } } as WikidataEntity;
    expect(itemMatchesSport(judo, 'https://en.wikipedia.org/wiki/Sumo', ['Sumo'])).toBe(false);
    expect(itemMatchesSport(judo, 'https://en.wikipedia.org/wiki/Judo', ['Sumo'])).toBe(true);
    const painter = { id: 'Q217434', labels: { en: { value: 'Grant Wood' } } } as WikidataEntity;
    expect(itemMatchesSport(painter, 'https://pt.wikipedia.org/w/index.php?search=Jiu-jitsu', ['jiu jitsu', 'Brazilian jiu-jitsu'])).toBe(false);
    expect(itemMatchesSport({ id: 'Q1', labels: { en: { value: 'Brazilian jiu-jitsu' } } } as WikidataEntity, null, ['Jiu-jitsu'])).toBe(true);
    expect(itemMatchesSport({ id: 'Q1' } as WikidataEntity, null, ['x'])).toBe(true);
  });

  it('picks the first freely licensed candidate, with author, license, page and year', () => {
    const infos = new Map([
      ['Nc.jpg', info('CC BY-NC 2.0')],
      ['Ball.jpg', info('CC BY-SA 4.0')],
    ]);
    const picked = pickSportImage('football', 'Q2736', ['Nc.jpg', 'Ball.jpg'], infos);
    expect(isSportImage(picked)).toBe(true);
    expect(picked).toMatchObject({ sport: 'football', file: 'Ball.jpg', author: 'Jane & Co', license: 'CC BY-SA 4.0', year: 2014 });
    expect((picked as SportImage).thumbUrl).toContain('/thumb/');
  });

  it('explains why a sport gets no image', () => {
    expect(pickSportImage('x', null, [], new Map())).toEqual({ sport: 'x', qid: null, reason: 'no Wikidata item' });
    expect(pickSportImage('x', 'Q1', [], new Map())).toMatchObject({ reason: 'no image (P18) on the Wikidata item' });
    expect(pickSportImage('x', 'Q1', ['Nc.jpg'], new Map([['Nc.jpg', info('CC BY-NC-SA 3.0')]]))).toMatchObject({
      reason: 'Nc.jpg: license not allowed (CC BY-NC-SA 3.0)',
    });
    expect(pickSportImage('x', 'Q1', ['Gone.jpg'], new Map())).toMatchObject({ reason: 'Gone.jpg: file metadata not found on Commons' });
  });
});

describe('SportImagesProvider', () => {
  const rows = [
    { id: 's1', slug: 'football', qid: 'Q2736', wikipediaUrl: null },
    { id: 's2', slug: 'draughts', qid: null, wikipediaUrl: null },
    { id: 's3', slug: 'chess', qid: 'Q718', wikipediaUrl: null },
  ];
  const fakeContext = () => {
    const document = vi.fn(async (source: string, url: string) => {
      if (source === 'wikidata')
        return {
          text: JSON.stringify({ entities: { Q2736: entity([['ball.jpg', 'normal']]), Q718: { id: 'Q718', claims: {} } } }),
          documentId: 'doc-wd',
        };
      expect(new URL(url).searchParams.get('titles')).toBe('File:Ball.jpg');
      return { text: JSON.stringify({ query: { pages: { '1': { title: 'File:Ball.jpg', imageinfo: [info('CC BY-SA 4.0')] } } } }), documentId: 'doc-c' };
    });
    const observe = vi.fn(async () => ({ id: 'obs', isNew: true }));
    // Two reads: the sports (with a slug) and their names (none here).
    const db = { select: (cols: Record<string, unknown>) => ({ from: () => ({ where: async () => ('slug' in cols ? rows : []) }) }) };
    return { ctx: { db, document, observe, log: vi.fn() } as unknown as IngestContext, document, observe };
  };

  it('collects through the wikidata and commons policies and observes each chosen image', async () => {
    const { ctx, document, observe } = fakeContext();
    const file = await new SportImagesProvider().collect(ctx);
    expect(document.mock.calls.map((c) => c[0])).toEqual(['wikidata', 'commons']);
    expect(file.images.map((i) => i.sport)).toEqual(['football']);
    expect(file.missing.map((m) => [m.sport, m.reason])).toEqual([
      ['chess', 'no image (P18) on the Wikidata item'],
      ['draughts', 'no Wikidata item'],
    ]);
    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledWith('doc-wd', 'sport-images', expect.anything(), 'Q2736:sport_image', 'image', expect.anything());
  });

  it('honours --only and reports counts by license', async () => {
    const { ctx } = fakeContext();
    expect(await new SportImagesProvider().runWith(ctx, { only: 'football' })).toEqual([
      'sport-images: 1 images, 0 sports without a suitable image',
      '  CC BY-SA 4.0: 1',
    ]);
  });

  it('writes a review with every sport, image or reason', async () => {
    const { ctx } = fakeContext();
    const file: SportImagesFile = await new SportImagesProvider().collect(ctx);
    const md = sportImagesReview(file);
    expect(md).toContain('| football | [Ball.jpg](https://commons.wikimedia.org/wiki/File:Ball.jpg) | Jane & Co |');
    expect(md).toContain('| draughts | — | no Wikidata item |');
    expect(md).toContain('  - CC BY-SA 4.0: 1');
  });
});
