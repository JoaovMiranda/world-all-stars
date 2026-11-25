// Competition and edition pages (T4.1): whatever the universal model holds locally (football, BJJ today; Olympic,
// boxing, chess and Ironman editions appear as their providers write them). Empty sections stay empty arrays.
import { type CompetitionPage, type EditionPage, editionKeys, isLocale, medalTable } from '@was/shared';

import { BaseService } from '../../core/base.service';
import { contentLocaleOf } from '../catalog/catalog-translation.helper';
import type { CompetitionRow, EditionRow } from './competition-rows.interface';
import { CompetitionsRepository } from './competitions.repository';
import { competitionHeader, competitorRef, editionEvents, editionStatus, isoOf, latestIso, nationsById, sourceRefs } from './competitions-view.helper';

export class CompetitionsService extends BaseService {
  private get read() {
    return new CompetitionsRepository(this.db);
  }

  /** The competition (404 when unknown), its editions and their URL keys. */
  private async load(slug: string): Promise<{ competition: CompetitionRow; editions: EditionRow[]; keys: Map<string, string> }> {
    const competition = this.notFound(await this.read.competition(slug, this.ctx.locale));
    const editions = await this.read.editions(competition.id, this.ctx.locale);
    return { competition, editions, keys: editionKeys(editions) };
  }

  private contentLocale(c: CompetitionRow) {
    return contentLocaleOf(this.ctx.locale, [isLocale(c.nameLocale) ? c.nameLocale : null]);
  }

  private async nations(ids: readonly (string | null)[]) {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    return nationsById(await this.read.nations(unique, this.ctx.locale));
  }

  async competition(slug: string): Promise<CompetitionPage> {
    const { competition, editions, keys } = await this.load(slug);
    const ids = editions.map((e) => e.id);
    const [winners, sources] = await Promise.all([this.read.winners(ids), this.read.sources([competition.id, ...ids], ids)]);
    const nations = await this.nations([...editions.map((e) => e.hostCountryId), ...winners.map((w) => w.nationId)]);
    return {
      ...competitionHeader(competition),
      contentLocale: this.contentLocale(competition),
      editions: editions
        .map((e) => ({
          key: keys.get(e.id)!,
          year: e.year,
          label: e.label,
          number: e.number,
          startDate: e.startDate,
          endDate: e.endDate,
          host: e.hostCountryId ? (nations.get(e.hostCountryId) ?? null) : null,
          status: editionStatus(e.status),
          winners: winners.filter((w) => w.editionId === e.id).map((w) => competitorRef(w, nations)),
        }))
        .reverse(),
      sources: sourceRefs(sources),
      updatedAt: latestIso([isoOf(competition.updatedAt), ...editions.map((e) => isoOf(e.updatedAt))]),
    };
  }

  async edition(slug: string, key: string): Promise<EditionPage> {
    const { competition, editions, keys } = await this.load(slug);
    const index = editions.findIndex((e) => keys.get(e.id) === key);
    const edition = this.notFound(editions[index]);
    const locale = this.ctx.locale;
    const [events, entries, results, members, lineups, sources] = await Promise.all([
      this.read.events(edition.id, locale),
      this.read.entries(edition.id),
      this.read.results(edition.id, locale),
      this.read.members(edition.id, locale),
      this.read.lineups(edition.id, locale),
      this.read.sources([edition.id], [edition.id]),
    ]);
    const nations = await this.nations([edition.hostCountryId, ...entries.map((e) => e.nationId)]);
    const ref = (e: EditionRow | undefined) => (e ? { key: keys.get(e.id)!, year: e.year, label: e.label } : null);
    const eventViews = editionEvents(events, { entries, results, members, lineups }, nations);
    return {
      contentLocale: this.contentLocale(competition),
      competition: competitionHeader(competition),
      key,
      year: edition.year,
      label: edition.label,
      number: edition.number,
      startDate: edition.startDate,
      endDate: edition.endDate,
      host: edition.hostCountryId ? (nations.get(edition.hostCountryId) ?? null) : null,
      hostCity: edition.hostCity,
      status: editionStatus(edition.status),
      previous: ref(editions[index - 1]),
      next: ref(editions[index + 1]),
      events: eventViews,
      medalTable: medalTable(eventViews),
      sources: sourceRefs(sources),
      updatedAt: latestIso([isoOf(competition.updatedAt), isoOf(edition.updatedAt)]),
    };
  }
}
