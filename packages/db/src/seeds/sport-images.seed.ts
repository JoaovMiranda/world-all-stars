// Sport page images (handoff T4.4) from data/content/sport-images.json (written by `pnpm ingest sport-images`): one
// Commons image per sport, linked only (never copied), with author, license and file page. Stored as a media_links row
// plus the sport's `image` content section that points to it. Idempotent; licenses are re-checked here too.
import fs from 'node:fs';
import path from 'node:path';

import { isFreeLicense, SPORT_IMAGE_SECTION_KEY, SPORT_IMAGES_DATA_FILE } from '@was/shared';
import { and, eq, isNull } from 'drizzle-orm';

import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import type { SportImagesFile } from '../interfaces/sport-images-file.interface';
import { mediaLinks, sources } from '../tables/source.table';
import { sports } from '../tables/sport.table';
import { sportContentSections } from '../tables/sport-content.table';
import type { Database } from '../types/database.type';

export const seedSportImages = async (db: Database, repoRoot: string): Promise<number> => {
  const file = path.join(repoRoot, SPORT_IMAGES_DATA_FILE);
  if (!fs.existsSync(file)) return 0;
  const content = JSON.parse(fs.readFileSync(file, 'utf8')) as SportImagesFile;
  const [commons] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(and(eq(sources.slug, 'commons'), isNull(sources.deletedAt)));
  let n = 0;
  for (const image of content.images) {
    if (!isFreeLicense(image.license)) continue;
    const [sport] = await db
      .select({ id: sports.id })
      .from(sports)
      .where(and(eq(sports.slug, image.sport), isNull(sports.deletedAt)));
    if (!sport) continue;
    const mediaId = await upsertRow(db, mediaLinks, {
      id: seedId('media', 'sport-image', image.sport),
      createdVia: 'seed',
      url: image.url,
      thumbUrl: image.thumbUrl,
      filePageUrl: image.page,
      kind: 'photo',
      author: image.author,
      license: image.license,
      year: image.year,
      status: 'ok',
      lastVerifiedAt: content.generatedAt,
      sourceId: commons?.id ?? null,
    });
    await upsertRow(db, sportContentSections, {
      id: seedId('section', image.sport, SPORT_IMAGE_SECTION_KEY),
      createdVia: 'seed',
      sportId: sport.id,
      sectionKey: SPORT_IMAGE_SECTION_KEY,
      sortOrder: -1,
      mediaLinkId: mediaId,
      status: 'published',
    });
    n++;
  }
  return n;
};
