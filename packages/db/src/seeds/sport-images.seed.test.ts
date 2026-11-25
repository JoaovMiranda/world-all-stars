import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { SPORT_IMAGE_SECTION_KEY, SPORT_IMAGES_DATA_FILE } from '@was/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase } from '../client';
import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import type { DatabaseHandle } from '../interfaces/database-handle.interface';
import type { SportImagesFile } from '../interfaces/sport-images-file.interface';
import { mediaLinks } from '../tables/source.table';
import { sportGroups, sportSubgroups, sports } from '../tables/sport.table';
import { sportContentSections } from '../tables/sport-content.table';
import type { Database } from '../types/database.type';
import { seedSourcesPolicy } from './sources-policy.seed';
import { seedSportImages } from './sport-images.seed';

const image = (sport: string, license: string): SportImagesFile['images'][number] => ({
  sport,
  qid: 'Q1',
  file: `${sport}.jpg`,
  url: `https://upload.wikimedia.org/wikipedia/commons/a/ab/${sport}.jpg`,
  thumbUrl: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/${sport}.jpg/960px-${sport}.jpg`,
  page: `https://commons.wikimedia.org/wiki/File:${sport}.jpg`,
  author: 'Jane Doe',
  license,
  licenseUrl: null,
  year: 2010,
});

describe('seedSportImages', () => {
  let h: DatabaseHandle;
  let db: Database;
  let dir: string;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
    db = h.db;
    await seedSourcesPolicy(db);
    const groupId = await upsertRow(db, sportGroups, { id: seedId('t-group'), slug: 'physical', sortOrder: 1 });
    const subgroupId = await upsertRow(db, sportSubgroups, { id: seedId('t-subgroup'), groupId, slug: 'aquatics', sortOrder: 1 });
    for (const slug of ['aquatics', 'athletics'])
      await upsertRow(db, sports, {
        id: seedId('t-sport', slug),
        subgroupId,
        slug,
        statsSchemaKey: 'generic',
        colorToken: 'teal',
        environment: 'closed',
        format: 'individual',
      });
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sport-images-'));
    const file: SportImagesFile = {
      generatedAt: '2026-11-24',
      source: 'test',
      images: [image('aquatics', 'CC BY-SA 4.0'), image('athletics', 'CC BY-NC 2.0'), image('no-such-sport', 'CC0')],
      missing: [],
    };
    fs.mkdirSync(path.join(dir, path.dirname(SPORT_IMAGES_DATA_FILE)), { recursive: true });
    fs.writeFileSync(path.join(dir, SPORT_IMAGES_DATA_FILE), JSON.stringify(file));
  });
  afterAll(async () => {
    await h.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('links only freely licensed images of known sports, with author and license, idempotently', async () => {
    expect(await seedSportImages(db, dir)).toBe(1);
    expect(await seedSportImages(db, dir)).toBe(1);
    const [aquatics] = await db.select().from(sports).where(eq(sports.slug, 'aquatics'));
    const sections = await db.select().from(sportContentSections).where(eq(sportContentSections.sectionKey, SPORT_IMAGE_SECTION_KEY));
    expect(sections).toHaveLength(1);
    expect(sections[0]!.sportId).toBe(aquatics!.id);
    const [media] = await db.select().from(mediaLinks).where(eq(mediaLinks.id, sections[0]!.mediaLinkId!));
    expect(media).toMatchObject({ author: 'Jane Doe', license: 'CC BY-SA 4.0', filePageUrl: 'https://commons.wikimedia.org/wiki/File:aquatics.jpg' });
    expect(media!.sourceId).not.toBeNull();
  });

  it('does nothing without the data file', async () => {
    expect(await seedSportImages(db, '/nonexistent-repo')).toBe(0);
  });
});
