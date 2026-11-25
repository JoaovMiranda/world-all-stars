import { BaseReadRepository } from '@was/db';
import { sql } from 'drizzle-orm';

import type { SitemapEditionRow, SitemapImageRow, SitemapPathRow } from './sitemap-rows.interface';

/** Public athlete with a profile page (same rule as the catalog: public visibility and at least one sport). */
const LISTABLE_ATHLETE = sql.raw(`
  join competitors cp on cp.id = a.id and cp.deleted_at is null and cp.profile_visibility = 'public'
  where a.deleted_at is null and exists (select 1 from athlete_sports s where s.athlete_id = a.id and s.deleted_at is null)`);

/**
 * Read model of the per-type sitemaps (T4.7): published rankings, methodologies, competitions and their editions,
 * licensed images and "on this day" days, each with the last change of its data (`lastmod`). Query-only.
 */
export class SitemapRepository extends BaseReadRepository {
  /** Published ranking snapshots (`/rankings/<id>`), last change = publication. */
  publishedRankings(): Promise<SitemapPathRow[]> {
    return this.selectRows<SitemapPathRow>(sql`
      select s.id as key, coalesce(s.published_at, s.updated_at) as "updatedAt"
      from ranking_snapshots s where s.deleted_at is null and s.status = 'published'
      order by s.ranking_key, s.id`);
  }

  /** Last publication per methodology key (lastmod of `/rankings/<key>/methodology`). */
  methodologyPublications(): Promise<SitemapPathRow[]> {
    return this.selectRows<SitemapPathRow>(sql`
      select m.key, max(coalesce(s.published_at, s.updated_at)) as "updatedAt"
      from ranking_methodologies m
      join ranking_calculation_runs r on r.methodology_id = m.id and r.deleted_at is null
      join ranking_snapshots s on s.run_id = r.id and s.deleted_at is null and s.status = 'published'
      where m.deleted_at is null
      group by m.key`);
  }

  /** Last change of what the cross-sport page reads (granted recognitions and the mapping rows). */
  async crossSportUpdatedAt(): Promise<Date | string | null> {
    const [row] = await this.selectRows<{ updatedAt: Date | string | null }>(sql`
      select greatest(
        (select max(g.updated_at) from recognition_grants g where g.deleted_at is null),
        (select max(m.updated_at) from cross_sport_mappings m where m.deleted_at is null)
      ) as "updatedAt"`);
    return row?.updatedAt ?? null;
  }

  /** Competitions with at least one real (non-example) edition; last change of the competition or its editions. */
  competitions(): Promise<SitemapPathRow[]> {
    return this.selectRows<SitemapPathRow>(sql`
      select c.slug as key, greatest(c.updated_at, max(e.updated_at)) as "updatedAt"
      from competitions c
      join competition_editions e on e.competition_id = c.id and e.deleted_at is null and e.is_example = false
      where c.deleted_at is null
      group by c.id, c.slug, c.updated_at
      order by c.slug`);
  }

  /** Real editions of every competition (their URL keys are computed per competition). */
  editions(): Promise<SitemapEditionRow[]> {
    return this.selectRows<SitemapEditionRow>(sql`
      select e.id, c.slug as competition, e.year, e.edition_number as number, e.start_date::text as "startDate",
        greatest(c.updated_at, e.updated_at) as "updatedAt"
      from competition_editions e
      join competitions c on c.id = e.competition_id and c.deleted_at is null
      where e.deleted_at is null and e.is_example = false
      order by c.slug, e.year nulls last, e.id`);
  }

  /** Verified images with a license: athlete photos (profile page) and published sport section images (sport page). */
  images(): Promise<SitemapImageRow[]> {
    return this.selectRows<SitemapImageRow>(sql`
      select '/athletes/' || a.slug as path, ml.url, ml.license, ml.file_page_url as "filePage", greatest(a.updated_at, ml.updated_at) as "updatedAt"
      from athletes a
      join media_links ml on ml.id = a.photo_media_link_id and ml.deleted_at is null and ml.status = 'ok' and coalesce(ml.license, '') <> ''
      ${LISTABLE_ATHLETE}
      union all
      select '/sports/' || sp.slug as path, ml.url, ml.license, ml.file_page_url as "filePage", greatest(sc.updated_at, ml.updated_at) as "updatedAt"
      from sport_content_sections sc
      join sports sp on sp.id = sc.sport_id and sp.deleted_at is null
      join media_links ml on ml.id = sc.media_link_id and ml.deleted_at is null and ml.status = 'ok' and coalesce(ml.license, '') <> ''
      where sc.deleted_at is null and sc.status = 'published'
      order by path, url`);
  }

  /** Month-days with a milestone of a listed athlete or a sport observance (`/on-this-day/<MM-DD>`). */
  todayDays(): Promise<SitemapPathRow[]> {
    return this.selectRows<SitemapPathRow>(sql`
      select lpad(cd.month::text, 2, '0') || '-' || lpad(cd.day::text, 2, '0') as key, max(x.updated_at) as "updatedAt"
      from calendar_days cd
      join (
        select m.calendar_day_id, m.updated_at from athlete_milestones m join athletes a on a.id = m.athlete_id ${LISTABLE_ATHLETE} and m.deleted_at is null
        union all
        select o.calendar_day_id, o.updated_at from observance_days o where o.deleted_at is null
      ) x on x.calendar_day_id = cd.id
      where cd.deleted_at is null
      group by cd.month, cd.day
      order by cd.month, cd.day`);
  }
}
