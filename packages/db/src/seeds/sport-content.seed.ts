// Editorial sections of sport pages (handoff v3 §10) from data/content/sport-sections.json: English base + pt-BR/es,
// certainty, and the sources behind the facts (source_links of the section). Idempotent; sections are published.
import fs from 'node:fs';
import path from 'node:path';

import { eq } from 'drizzle-orm';

import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import type { SportContent } from '../interfaces/sport-content.interface';
import { domainValues } from '../tables/domain.table';
import { sourceLinks } from '../tables/source.table';
import { sports } from '../tables/sport.table';
import { sportContentSections, sportContentSectionTranslations } from '../tables/sport-content.table';
import type { Database } from '../types/database.type';

export const seedSportContent = async (db: Database, repoRoot: string): Promise<number> => {
  const file = path.join(repoRoot, 'data/content/sport-sections.json');
  if (!fs.existsSync(file)) return 0;
  const content = JSON.parse(fs.readFileSync(file, 'utf8')) as SportContent;
  const certainty = new Map((await db.select().from(domainValues)).filter((d) => d.domain === 'certainty').map((d) => [d.slug, d.id]));
  let n = 0;
  for (const [slug, s] of Object.entries(content.sports)) {
    const [sport] = await db.select().from(sports).where(eq(sports.slug, slug));
    if (!sport) continue;
    for (const [i, section] of s.sections.entries()) {
      const id = await upsertRow(db, sportContentSections, {
        id: seedId('section', slug, section.key),
        createdVia: 'seed',
        sportId: sport.id,
        sectionKey: section.key,
        sortOrder: i,
        status: 'published',
        certaintyId: certainty.get(s.certainty) ?? null,
      });
      for (const locale of ['en', 'pt-BR', 'es'] as const) {
        const t = section[locale];
        if (t)
          await upsertRow(db, sportContentSectionTranslations, {
            id: seedId('section_tr', slug, section.key, locale),
            createdVia: 'seed',
            sectionId: id,
            locale,
            title: t[0],
            body: t[1],
          });
      }
      for (const url of s.sources)
        await upsertRow(db, sourceLinks, {
          id: seedId('section_src', id, url),
          createdVia: 'seed',
          entityType: 'sport_content_sections',
          entityId: id,
          url,
          origin: 'system',
        });
      n++;
    }
  }
  return n;
};
