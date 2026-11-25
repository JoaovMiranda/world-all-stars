// Cross-sport bands S–D (D07) and legacy levels L1–L5 (D11): computed on read from published data with the pure
// @was/ranking engines. Nothing here writes: the readout is reproducible from the grants and the mapping rows alone,
// and the legacy level never feeds the band (or any ranking score).
import { CROSS_SPORT_BAND_ORDER, computeLegacyLevel, LEGACY_THRESHOLDS, legacyEvidenceOf, runCrossSport } from '@was/ranking';
import {
  type AthleteBandResponse,
  type AthleteLegacyResponse,
  CROSS_SPORT_BAND_POINTS,
  type CrossSportFilters,
  type CrossSportListResponse,
  type CrossSportMethodologyResponse,
  type CrossSportUnmappedResponse,
} from '@was/shared';

import { BaseService } from '../../core/base.service';
import { CrossSportRepository } from './cross-sport.repository';
import { crossSportEntriesOf, crossSportPage, filterCrossSportEntries } from './cross-sport-view.helper';

/** Use cases of `/rankings/all-sports`, its methodology, the athlete readouts and the admin review list. */
export class CrossSportService extends BaseService {
  private get read() {
    return new CrossSportRepository(this.db);
  }

  /** Facts + mappings + the engine run (all public athletes, or one). */
  private async calculate(competitorId?: string) {
    const [facts, mappings] = await Promise.all([this.read.facts(this.ctx.locale, competitorId), this.read.mappings()]);
    return { facts, mappings, run: runCrossSport(facts, mappings) };
  }

  private async athleteOr404(slug: string) {
    return this.notFound(await this.read.athlete(slug));
  }

  async list(filters: CrossSportFilters): Promise<CrossSportListResponse> {
    const { facts, run } = await this.calculate();
    const all = crossSportEntriesOf(run, facts);
    const gender = new Map(facts.map((f) => [f.competitorId, f.gender]));
    const filtered = filterCrossSportEntries(all, filters, (id) => gender.get(id) ?? null);
    const sports = [...new Map(all.flatMap((e) => e.sports).map((s) => [s.slug, s])).values()].sort((a, b) => a.name.localeCompare(b.name, this.ctx.locale));
    return { ...crossSportPage(run, filtered, filters.page ?? 1), sports };
  }

  async methodology(): Promise<CrossSportMethodologyResponse> {
    const { mappings, run } = await this.calculate();
    const sports = [...new Set(mappings.map((m) => m.sport))];
    const names = await this.read.sportNames(sports, this.ctx.locale);
    return {
      rulesetVersion: run.rulesetVersion,
      inputHash: run.inputHash,
      outputHash: run.outputHash,
      bands: CROSS_SPORT_BAND_ORDER.map((band) => ({ band, points: CROSS_SPORT_BAND_POINTS[band] })),
      rulesets: sports.map((sport) => ({
        sport,
        name: names.get(sport) ?? sport,
        rulesetKey: `${run.rulesetVersion}/${sport}`,
        hash: run.rulesetHashes[sport] ?? '',
        mappings: mappings
          .filter((m) => m.sport === sport)
          .map((m) => ({
            kind: m.kind,
            value: m.value,
            band: m.band,
            fromYear: m.fromYear ?? null,
            toYear: m.toYear ?? null,
            sourceNote: m.sourceNote ?? null,
          })),
      })),
      competitors: run.entries.length,
      unmappedTotal: run.unmapped.length,
    };
  }

  async athleteBand(slug: string): Promise<AthleteBandResponse> {
    const athlete = await this.athleteOr404(slug);
    const { facts, run } = await this.calculate(athlete.id);
    const [entry] = crossSportEntriesOf(run, facts);
    return {
      slug,
      rulesetVersion: run.rulesetVersion,
      outputHash: run.outputHash,
      band: entry?.band ?? null,
      points: entry?.points ?? 0,
      items: entry?.items ?? [],
      pendingReview: run.unmapped.length,
    };
  }

  async unmapped(): Promise<CrossSportUnmappedResponse> {
    const { facts, run } = await this.calculate();
    const byId = new Map(facts.map((f) => [f.evidenceId, f]));
    const items = run.unmapped.map((error) => {
      const { item } = error;
      const fact = byId.get(item.evidenceId);
      return {
        evidenceId: item.evidenceId,
        competitor: { id: item.competitorId, name: fact?.competitorName ?? item.competitorId, slug: fact?.competitorSlug ?? item.competitorId },
        sport: item.sport,
        kind: item.kind,
        value: item.value,
        label: fact?.label ?? item.value,
        year: item.year,
        error: error.message,
      };
    });
    items.sort((a, b) => a.sport.localeCompare(b.sport) || a.value.localeCompare(b.value) || a.evidenceId.localeCompare(b.evidenceId));
    return { rulesetVersion: run.rulesetVersion, total: items.length, items };
  }

  async athleteLegacy(slug: string): Promise<AthleteLegacyResponse> {
    const athlete = await this.athleteOr404(slug);
    const [facts, context] = await Promise.all([this.read.facts(this.ctx.locale, athlete.id), this.read.legacyContext(athlete, this.ctx.locale)]);
    const lastYear = Math.max(context.careerEndYear ?? 0, ...facts.map((f) => f.year ?? 0));
    const career = context.careerStartYear ? { fromYear: context.careerStartYear, toYear: Math.max(lastYear, context.careerStartYear) } : null;
    const result = computeLegacyLevel(legacyEvidenceOf(facts, { career, dossierStatus: context.dossierStatus, records: context.records }));
    const labels = new Map<string, string>([
      ...facts.map((f): [string, string] => [f.evidenceId, f.label]),
      ...context.records.map((r): [string, string] => [r.evidenceId, r.label]),
    ]);
    return {
      slug,
      rulesetVersion: result.rulesetVersion,
      level: result.level,
      score: result.score,
      accepted: result.accepted.map((h) => ({
        evidenceId: h.evidenceId,
        kind: h.kind,
        label: labels.get(h.evidenceId) ?? h.kind,
        points: h.points,
        year: h.year,
      })),
      excluded: result.excluded.map((e) => ({ evidenceId: e.evidenceId, label: labels.get(e.evidenceId) ?? e.evidenceId, reason: e.reason })),
      dossierStatus: context.dossierStatus,
      l5Threshold: LEGACY_THRESHOLDS.L5,
      explanation: result.explanation,
    };
  }
}
