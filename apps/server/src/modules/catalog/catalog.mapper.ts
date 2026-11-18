// Database rows → API views (the shapes of the shared contracts). A TypeScript port of the prototype's
// mock/api/repository.js, which the web fixtures were generated from: same rules, so fixtures and API agree.
import {
  type Achievement,
  AchievementKind,
  type AthleteFilters,
  type AthleteProfile,
  type AthleteRef,
  type AthleteSummary,
  type CalendarEvent,
  CalendarEventType,
  type CompetitionEvent,
  type CountryRef,
  type GlobeCountry,
  type GovernanceModelInfo,
  type HallOfGreatsEntry,
  type IsoDate,
  type MediaLink,
  type Observance,
  type OnThisDayResponse,
  type Organization,
  type OrgTreeNode,
  type SourceOverview,
  type SourceRef,
  type SportAssociation,
  type SportGroup,
  type SportInfo,
  type SportPage,
  type SportCard,
  Tier,
  WINNING_ACHIEVEMENT_TYPES,
  matchesAthleteFilters,
  normalizeAnalysis,
  type AnalysisDimensionsResponse,
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
  ORG_LABELS_MESSAGES,
  textFor,
} from '@was/shared';

import type { CatalogRows } from './catalog.repository';

/** Content fallback after the requested locale: the source language, then English, then whatever exists. */
const FALLBACK_CHAIN: readonly Locale[] = [DEFAULT_LOCALE, 'en'];
/** Placeholder organizer of the prototype: never shown as an association. */
const UNKNOWN_ORGANIZER_SLUG = 'organizador-nao-informado';
const WINNING = new Set<string>(WINNING_ACHIEVEMENT_TYPES);

type R = CatalogRows;
type Translated = { locale: string } & Record<string, unknown>;

const pad2 = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);
const byId = <X extends { id: string }>(rows: X[]) => new Map(rows.map((r) => [r.id, r]));
const groupBy = <X, K>(rows: X[], key: (r: X) => K) => {
  const out = new Map<K, X[]>();
  for (const r of rows) {
    const k = key(r);
    const list = out.get(k);
    if (list) list.push(r);
    else out.set(k, [r]);
  }
  return out;
};
const memo = <K, V>(fn: (k: K) => V) => {
  const cache = new Map<K, V>();
  return (k: K): V => {
    if (!cache.has(k)) cache.set(k, fn(k));
    return cache.get(k) as V;
  };
};

/**
 * Translation lookup of one translation table: requested locale, then pt-BR, then en, then any locale. `localeOf`
 * tells which language a record's text actually came in (the `contentLocale` of detail responses).
 */
const translator = <X extends Translated>(rows: X[], parentKey: keyof X, locale: Locale) => {
  const index = groupBy(rows, (r) => r[parentKey] as string);
  const order = [locale, ...FALLBACK_CHAIN.filter((l) => l !== locale)];
  const pick = (id: string | null | undefined): X | undefined => {
    if (!id) return undefined;
    const list = index.get(id) ?? [];
    for (const l of order) {
      const hit = list.find((r) => r.locale === l);
      if (hit) return hit;
    }
    return list[0];
  };
  const text = (id: string | null | undefined, field: keyof X): string | null => (pick(id)?.[field] as string | null | undefined) ?? null;
  return Object.assign(text, {
    localeOf: (id: string | null | undefined): Locale | null => {
      const hit = pick(id)?.locale;
      return isLocale(hit) ? hit : null;
    },
  });
};

/** Language the content of a response came in: the first record not in the requested locale wins (else the requested one). */
const contentLocaleOf = (requested: Locale, found: readonly (Locale | null)[]): Locale => found.find((l) => l && l !== requested) ?? requested;

/** Read model over one catalog snapshot (built once per snapshot by the CatalogCache, memoized inside). */
export class CatalogView {
  readonly tierOf: (id: string) => Tier;
  readonly country: (id: string | null | undefined) => CountryRef | null;
  readonly sportInfo: (id: string) => SportInfo;
  readonly summaryById: (id: string) => AthleteSummary;
  private readonly achievementsById: (athleteId: string) => Achievement[];
  private readonly orgViewById: (id: string) => Organization;
  private readonly maps;
  private readonly t;
  private readonly orgLabels;

  constructor(
    readonly rows: R,
    readonly locale: Locale = DEFAULT_LOCALE,
  ) {
    this.orgLabels = textFor(ORG_LABELS_MESSAGES, locale);
    const m = {
      days: byId(rows.calendarDays),
      countries: byId(rows.countries),
      cities: byId(rows.cities),
      levels: byId(rows.levels),
      tiers: byId(rows.tiers),
      types: byId(rows.achievementTypes),
      governance: byId(rows.governance),
      orgKinds: byId(rows.orgKinds),
      groups: byId(rows.groups),
      subgroups: byId(rows.subgroups),
      sports: byId(rows.sports),
      orgs: byId(rows.organizations),
      competitions: byId(rows.competitions),
      editions: byId(rows.editions),
      awards: byId(rows.awards),
      awardEditions: byId(rows.awardEditions),
      teams: byId(rows.teams),
      sources: byId(rows.sources),
      links: byId(rows.sourceLinks),
      media: byId(rows.mediaLinks),
      athletes: byId(rows.athletes),
      prizeForms: byId(rows.prizeForms),
      achievementsByAthlete: groupBy(rows.achievements, (a) => a.athleteId),
      athleteSportsByAthlete: groupBy(rows.athleteSports, (a) => a.athleteId),
      nationalitiesByAthlete: groupBy(rows.nationalities, (n) => n.athleteId),
      orgChildren: groupBy(rows.organizations, (o) => o.parentOrganizationId),
      editionsByCompetition: groupBy(rows.editions, (e) => e.competitionId),
    };
    this.maps = m;
    this.t = {
      country: translator(rows.countryTr, 'countryId', locale),
      city: translator(rows.cityTr, 'cityId', locale),
      governance: translator(rows.governanceTr, 'governanceModelId', locale),
      orgKind: translator(rows.orgKindTr, 'organizationKindId', locale),
      group: translator(rows.groupTr, 'groupId', locale),
      subgroup: translator(rows.subgroupTr, 'subgroupId', locale),
      sport: translator(rows.sportTr, 'sportId', locale),
      category: translator(rows.categoryTr, 'categoryId', locale),
      competition: translator(rows.competitionTr, 'competitionId', locale),
      award: translator(rows.awardTr, 'awardId', locale),
      observance: translator(rows.observanceTr, 'observanceDayId', locale),
      athlete: translator(rows.athleteTr, 'athleteId', locale),
      milestone: translator(rows.milestoneTr, 'milestoneId', locale),
      dossier: translator(rows.dossierTr, 'dossierId', locale),
      evidence: translator(rows.evidenceTr, 'evidenceId', locale),
    };
    this.tierOf = (id) => m.tiers.get(id)!.slug;
    this.country = (id) => {
      const c = id ? m.countries.get(id) : undefined;
      return c ? { iso2: c.iso2, flag: c.flagEmoji, name: this.t.country(c.id, 'name') ?? c.iso2 } : null;
    };
    this.sportInfo = memo((id: string): SportInfo => {
      const s = m.sports.get(id)!;
      const sg = m.subgroups.get(s.subgroupId)!;
      const g = m.groups.get(sg.groupId)!;
      return {
        id: s.id,
        slug: s.slug,
        name: this.t.sport(s.id, 'name') ?? s.slug,
        colorToken: s.colorToken.replace(/^--/, ''),
        statsSchema: s.statsSchemaKey,
        subgroup: this.t.subgroup(sg.id, 'name') ?? sg.slug,
        group: this.t.group(g.id, 'name') ?? g.slug,
        groupSlug: g.slug,
        environment: s.environment,
        format: s.format,
        governance: s.governanceModelId ? (m.governance.get(s.governanceModelId)?.slug ?? null) : null,
      };
    });
    this.achievementsById = memo((athleteId: string) => (m.achievementsByAthlete.get(athleteId) ?? []).map((x) => this.achievementView(x)));
    this.summaryById = memo((id: string) => this.buildSummary(id));
    this.orgViewById = memo((id: string) => this.buildOrgView(id));
  }

  // ── small references ──
  cdIso(cdId: string | null, year: number | null): IsoDate | null {
    if (!cdId || !year) return null;
    const c = this.maps.days.get(cdId);
    return c ? `${year}-${pad2(c.month)}-${pad2(c.day)}` : null;
  }
  source(linkId: string | null | undefined): SourceRef | null {
    const l = linkId ? this.maps.links.get(linkId) : undefined;
    const s = l?.sourceId ? this.maps.sources.get(l.sourceId) : undefined;
    return l && s ? { slug: s.slug, name: s.name, license: s.license, url: l.url, home: s.baseUrl } : null;
  }
  media(id: string | null): MediaLink | null {
    const m = id ? this.maps.media.get(id) : undefined;
    return m ? { url: m.thumbUrl || m.url, original: m.url, page: m.filePageUrl, author: m.author, license: m.license, year: m.year } : null;
  }
  athleteRef(id: string): AthleteRef {
    const a = this.maps.athletes.get(id)!;
    return { slug: a.slug, knownAs: a.knownAs, tier: this.tierOf(a.championTierId) };
  }
  athleteBySlug(slug: string) {
    return this.rows.athletes.find((a) => a.slug === slug) ?? null;
  }
  athleteNames(id: string): string[] {
    const a = this.maps.athletes.get(id)!;
    return [a.knownAs, a.fullName, ...a.nicknames].filter((n): n is string => !!n);
  }
  competitionName(id: string): string {
    return this.t.competition(id, 'name') ?? this.maps.competitions.get(id)?.slug ?? id;
  }
  sportBySlug(slug: string) {
    return this.rows.sports.find((s) => s.slug === slug) ?? null;
  }
  dossierOf(athleteId: string) {
    return this.rows.dossiers.find((d) => d.athleteId === athleteId) ?? null;
  }
  dossierHeadline(dossierId: string): string | null {
    return this.t.dossier(dossierId, 'headline');
  }
  evidenceDescription(evidenceId: string): string | null {
    return this.t.evidence(evidenceId, 'description');
  }
  sourceLink(id: string | null | undefined) {
    return id ? (this.maps.links.get(id) ?? null) : null;
  }

  // ── achievements, legacy, summaries ──
  private achievementView(x: R['achievements'][number]): Achievement {
    const type = this.maps.types.get(x.achievementTypeId)!;
    const base = { id: x.id, type: type.slug as Achievement['type'], weight: type.rankWeight, year: x.year, date: this.cdIso(x.calendarDayId, x.year), rank: x.rank, source: this.source(x.sourceLinkId) };
    if (x.competitionEditionId) {
      const ed = this.maps.editions.get(x.competitionEditionId)!;
      const c = this.maps.competitions.get(ed.competitionId)!;
      const level = this.maps.levels.get(c.competitionLevelId)!;
      return {
        ...base,
        kind: AchievementKind.Competition,
        competition: { slug: c.slug, name: this.competitionName(c.id) },
        edition: { label: ed.label, number: ed.editionNumber, host: this.country(ed.hostCountryId) },
        level: level.slug,
        levelWeight: level.weight,
        isOlympic: c.isOlympic,
        category: x.sportCategoryId ? this.t.category(x.sportCategoryId, 'name') : null,
        team: x.teamId ? (this.maps.teams.get(x.teamId)?.name ?? null) : null,
      };
    }
    const ae = this.maps.awardEditions.get(x.awardEditionId!)!;
    const aw = this.maps.awards.get(ae.awardId)!;
    const level = this.maps.levels.get(aw.competitionLevelId)!;
    return {
      ...base,
      kind: AchievementKind.Award,
      award: { slug: aw.slug, name: this.t.award(aw.id, 'name') ?? aw.slug, kind: aw.awardKind },
      label: ae.label,
      level: level.slug,
      levelWeight: level.weight,
    };
  }
  achievementsOf(athleteId: string): Achievement[] {
    return this.achievementsById(athleteId);
  }
  private wins(athleteId: string) {
    return this.achievementsOf(athleteId).filter((v) => v.kind === AchievementKind.Competition && WINNING.has(v.type));
  }
  /** Legacy score (doc 03): Σ rank_weight × level weight, with its breakdown. */
  legacy(athleteId: string): AthleteProfile['legacy'] {
    const parts = new Map<string, AthleteProfile['legacy']['rows'][number]>();
    for (const v of this.achievementsOf(athleteId)) {
      const key = `${v.level}|${v.type}`;
      const unit = v.weight * v.levelWeight;
      const p = parts.get(key) ?? { level: v.level, type: v.type, count: 0, points: 0, unit };
      p.count += 1;
      p.points += unit;
      parts.set(key, p);
    }
    const rows = [...parts.values()].sort((a, b) => b.points - a.points);
    return { total: rows.reduce((s, r) => s + r.points, 0), rows };
  }
  private buildSummary(id: string): AthleteSummary {
    const a = this.maps.athletes.get(id)!;
    const as = this.maps.athleteSportsByAthlete.get(id)?.[0];
    const nationalities = [...(this.maps.nationalitiesByAthlete.get(id) ?? [])]
      .sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary))
      .map((n) => this.country(n.countryId))
      .filter((c): c is CountryRef => !!c);
    const wins = this.wins(id);
    const tier = this.tierOf(a.championTierId);
    return {
      id: a.id,
      slug: a.slug,
      knownAs: a.knownAs,
      tier,
      percentile: a.legacyPercentile,
      photo: this.media(a.photoMediaLinkId),
      sport: this.sportInfo(as!.sportId),
      nationalities,
      careerFrom: a.careerStartYear,
      careerTo: a.careerEndYear,
      status: a.status,
      titles: wins.length,
      worldTitles: wins.filter((v) => v.level === 'world').length,
      isHallOfGreats: tier === Tier.Mythic,
    };
  }
  /** Athletes with a sport (a row without athlete_sports is incomplete and never listed). */
  private listable() {
    return this.rows.athletes.filter((a) => this.maps.athleteSportsByAthlete.has(a.id));
  }
  /** Indexable entity pages with their last change (sitemaps, doc 12): listable athletes and every sport. */
  sitemapEntries(): { athletes: { slug: string; updatedAt: Date }[]; sports: { slug: string; updatedAt: Date }[] } {
    return {
      athletes: this.listable().map((a) => ({ slug: a.slug, updatedAt: a.updatedAt })),
      sports: this.rows.sports.map((s) => ({ slug: s.slug, updatedAt: s.updatedAt })),
    };
  }
  athletes(filters: AthleteFilters = {}): AthleteSummary[] {
    return this.listable()
      .filter((a) => matchesAthleteFilters(this.summaryById(a.id), filters, this.athleteNames(a.id)))
      .map((a) => this.summaryById(a.id))
      .sort((x, y) => y.percentile - x.percentile);
  }

  profile(slug: string): AthleteProfile | null {
    const a = this.athleteBySlug(slug);
    if (!a || !this.maps.athleteSportsByAthlete.has(a.id)) return null;
    const r = this.rows;
    const as = this.maps.athleteSportsByAthlete.get(a.id)![0]!;
    const city = (id: string | null) => {
      const c = id ? this.maps.cities.get(id) : undefined;
      return c ? { name: this.t.city(c.id, 'name') ?? '?', region: c.region, country: this.country(c.countryId) } : null;
    };
    const stats = r.stats.find((s) => s.athleteId === a.id && s.period === 'career');
    const dossier = this.dossierOf(a.id);
    return {
      ...this.summaryById(a.id),
      contentLocale: contentLocaleOf(this.locale, [this.t.athlete.localeOf(a.id)]),
      wikidataQid: a.wikidataQid,
      fullName: a.fullName,
      nicknames: a.nicknames,
      position: as.position,
      category: as.primaryCategoryId ? this.t.category(as.primaryCategoryId, 'name') : null,
      birth: { date: a.birthDate, city: city(a.birthCityId) },
      death: a.deathDate ? { date: a.deathDate, city: city(a.deathCityId) } : null,
      heightCm: a.heightCm,
      dominantFoot: a.dominantFoot,
      shortBio: this.t.athlete(a.id, 'shortBio'),
      externalIds: a.externalIds,
      social: a.socialLinks,
      inclusionReason: a.inclusionReason,
      achievements: this.achievementsOf(a.id),
      teams: r.athleteTeams
        .filter((x) => x.athleteId === a.id)
        .map((x) => {
          const t = this.maps.teams.get(x.teamId)!;
          return { name: t.name, kind: t.kind, country: this.country(t.countryId), from: x.fromYear, to: x.toYear, fromDate: x.fromDate, toDate: x.toDate, role: x.role };
        })
        .sort((p, q) => (p.from ?? 0) - (q.from ?? 0)),
      stats: stats ? { ...stats.stats, schema: stats.statsSchemaKey } : null,
      reigns: r.reigns
        .filter((x) => x.athleteId === a.id)
        .map((x) => ({ competition: this.competitionName(x.competitionId), won: x.wonDate, lost: x.lostDate, endReason: x.endReason, source: this.source(x.sourceLinkId) })),
      milestones: r.milestones
        .filter((x) => x.athleteId === a.id)
        .map((x) => ({ date: x.date, kind: x.kind, title: this.t.milestone(x.id, 'title') ?? x.kind, source: this.source(x.sourceLinkId) }))
        .sort((p, q) => p.date.localeCompare(q.date)),
      dossier: dossier
        ? {
            status: dossier.status,
            approvals: dossier.approvalsCount,
            headline: this.t.dossier(dossier.id, 'headline'),
            evidences: r.evidences
              .filter((e) => e.dossierId === dossier.id)
              .map((e) => ({ type: e.evidenceType, text: this.t.evidence(e.id, 'description') ?? e.evidenceType, source: this.source(e.sourceLinkId) })),
          }
        : null,
      tierHistory: r.tierHistory
        .filter((h) => h.athleteId === a.id)
        .map((h) => ({ from: this.tierOf(h.fromTierId), to: this.tierOf(h.toTierId), reason: h.reason, at: h.decidedAt })),
      provenance: r.provenance
        .filter((p) => p.entityType === 'athletes' && p.entityId === a.id)
        .map((p) => ({ field: p.fieldName, ref: p.ref, retrievedAt: p.retrievedAt, source: this.source(p.sourceLinkId) })),
      conflicts: r.conflicts
        .filter((c) => c.entityType === 'athletes' && c.entityId === a.id)
        .map((c) => ({
          field: c.fieldName,
          chosen: { value: c.chosenValue, source: this.source(c.chosenSourceLinkId) },
          other: { value: c.otherValue, source: this.source(c.otherSourceLinkId) },
          resolution: c.resolution,
        })),
      legacy: this.legacy(a.id),
      version: {
        current: a.version,
        history: r.versions
          .filter((v) => v.entityId === a.id)
          .sort((p, q) => q.versionNumber - p.versionNumber)
          .map((v) => ({ n: v.versionNumber, summary: v.summary || 'update', author: v.author || 'system' })),
      },
      sourceLinks: r.sourceLinks
        .filter((l) => l.entityType === 'athletes' && l.entityId === a.id)
        .map((l) => this.source(l.id))
        .filter((s): s is SourceRef => !!s),
    };
  }

  /** Normalized analysis dimensions (doc 16), normalization rule shared (normalizeAnalysis). */
  analysis(now: number = new Date().getFullYear()): AnalysisDimensionsResponse {
    return normalizeAnalysis(
      this.listable().map((a) => {
        const ach = this.achievementsOf(a.id);
        const wins = this.wins(a.id);
        const years = (a.careerEndYear ?? now) - (a.careerStartYear ?? now) + 1;
        return {
          slug: a.slug,
          values: {
            worldTitles: wins.filter((v) => v.level === 'world').length,
            awards: ach.filter((v) => v.kind === AchievementKind.Award).length,
            longevity: years,
            dominance: Number((wins.length / Math.max(years, 1)).toFixed(2)),
            breadth: new Set(wins.map((v) => (v.kind === AchievementKind.Competition ? v.competition.slug : ''))).size,
            legacy: a.legacyPercentile,
          },
        };
      }),
    );
  }

  // ── organizations (doc 19) ──
  private buildOrgView(id: string): Organization {
    const o = this.maps.orgs.get(id)!;
    const k = this.maps.orgKinds.get(o.organizationKindId)!;
    return {
      id: o.id,
      slug: o.slug,
      name: o.name,
      kind: k.slug,
      kindLabel: this.t.orgKind(k.id, 'name') ?? k.slug,
      nature: k.nature,
      natureLabel: this.orgLabels.nature[k.nature],
      relation: o.parentRelation,
      relationLabel: o.parentRelation ? this.orgLabels.relation[o.parentRelation] : null,
      scope: this.maps.levels.get(o.scopeLevelId)!.slug,
      country: this.country(o.countryId),
      competitions: this.rows.competitions
        .filter((c) => c.organizationId === o.id)
        .map((c) => ({ name: this.competitionName(c.id), sport: this.sportInfo(c.sportId).name })),
      sports: this.rows.governingBodies.filter((b) => b.organizationId === o.id).map((b) => ({ ...this.sportInfo(b.sportId), role: b.role })),
      wikipedia: o.wikipediaUrl,
      image: o.imageUrl,
      description: o.shortDescription,
      qid: o.wikidataQid,
    };
  }
  orgChain(id: string): Organization[] {
    const out: Organization[] = [];
    const seen = new Set<string>();
    let o = this.maps.orgs.get(id);
    while (o && !seen.has(o.id)) {
      seen.add(o.id);
      out.unshift(this.orgViewById(o.id));
      o = o.parentOrganizationId ? this.maps.orgs.get(o.parentOrganizationId) : undefined;
    }
    return out;
  }
  orgTree(): OrgTreeNode[] {
    const node = (o: R['organizations'][number]): OrgTreeNode => ({
      ...this.orgViewById(o.id),
      children: [...(this.maps.orgChildren.get(o.id) ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map(node),
    });
    return [...(this.maps.orgChildren.get(null) ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map(node);
  }
  /** Who governs a sport + who organizes its competitions and awards, top of the hierarchy first. */
  sportAssociations(sportId: string): SportAssociation[] {
    const out = new Map<string, Omit<SportAssociation, 'chain'>>();
    const add = (orgId: string | null, role: string) => {
      const o = orgId ? this.maps.orgs.get(orgId) : undefined;
      if (!o || o.slug === UNKNOWN_ORGANIZER_SLUG) return;
      const v = out.get(o.id) ?? { ...this.orgViewById(o.id), roles: [], governs: false };
      if (!v.roles.includes(role)) v.roles.push(role);
      if (role !== 'organizer' && role !== 'award') v.governs = true;
      out.set(o.id, v);
    };
    for (const b of this.rows.governingBodies) if (b.sportId === sportId) add(b.organizationId, b.role);
    for (const c of this.rows.competitions) if (c.sportId === sportId) add(c.organizationId, 'organizer');
    for (const a of this.rows.awards) if (a.sportId === sportId) add(a.organizationId, 'award');
    return [...out.values()]
      .map((o) => ({ ...o, chain: this.orgChain(o.id).map((c) => ({ slug: c.slug, name: c.name, wikipedia: c.wikipedia, relationLabel: c.relationLabel })) }))
      .sort((a, b) => Number(b.governs) - Number(a.governs) || a.chain.length - b.chain.length || a.name.localeCompare(b.name));
  }

  // ── sports ──
  sportCard(sportId: string): SportCard {
    const info = this.sportInfo(sportId);
    const athletes = this.athletes({ sport: info.slug });
    return {
      ...info,
      athletes: athletes.length,
      mythic: athletes.filter((a) => a.tier === Tier.Mythic).length,
      competitions: this.rows.competitions.filter((c) => c.sportId === sportId).length,
      associations: this.sportAssociations(sportId),
    };
  }
  sportsTree(): SportGroup[] {
    return [...this.rows.groups]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((g) => ({
        slug: g.slug,
        name: this.t.group(g.id, 'name') ?? g.slug,
        subgroups: this.rows.subgroups
          .filter((s) => s.groupId === g.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((s) => ({ slug: s.slug, name: this.t.subgroup(s.id, 'name') ?? s.slug, sports: this.rows.sports.filter((x) => x.subgroupId === s.id).map((x) => this.sportCard(x.id)) })),
      }));
  }
  sportCards(): SportCard[] {
    return this.sportsTree().flatMap((g) => g.subgroups.flatMap((s) => s.sports));
  }
  governanceModels(): GovernanceModelInfo[] {
    return [...this.rows.governance]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((g) => ({
        slug: g.slug,
        name: this.t.governance(g.id, 'name') ?? g.slug,
        summary: this.t.governance(g.id, 'summary') ?? g.slug,
        sports: this.rows.sports.filter((s) => s.governanceModelId === g.id).map((s) => this.sportInfo(s.id)),
      }));
  }
  sportPage(slug: string, today: IsoDate, upcomingTo: IsoDate): SportPage | null {
    const s = this.sportBySlug(slug);
    if (!s) return null;
    const info = this.sportInfo(s.id);
    const cats = this.rows.categories.filter((c) => c.sportId === s.id);
    const gov = s.governanceModelId ? this.maps.governance.get(s.governanceModelId) : undefined;
    const report = this.rows.collectionReports.find((r) => r.sportId === s.id);
    const prizeFormIds = [...this.rows.competitions.filter((c) => c.sportId === s.id).map((c) => c.prizeFormId), ...this.rows.awards.filter((a) => a.sportId === s.id).map((a) => a.prizeFormId)];
    return {
      ...info,
      contentLocale: contentLocaleOf(this.locale, [this.t.sport.localeOf(s.id)]),
      description: this.t.sport(s.id, 'description'),
      rules: this.t.sport(s.id, 'rulesSummary'),
      wikipedia: s.wikipediaUrl,
      wikidataQid: s.wikidataQid,
      pinnacle: this.t.sport(s.id, 'pinnacle'),
      governanceInfo: gov ? { name: this.t.governance(gov.id, 'name') ?? gov.slug, summary: this.t.governance(gov.id, 'summary') ?? gov.slug } : null,
      bodies: this.rows.governingBodies
        .filter((b) => b.sportId === s.id)
        .map((b) => ({ name: this.maps.orgs.get(b.organizationId)?.name ?? '?', role: b.role, chain: this.orgChain(b.organizationId) })),
      prizeForms: [...new Set(prizeFormIds.filter((id): id is string => !!id))].map((id) => this.maps.prizeForms.get(id)?.slug ?? id),
      associations: this.sportAssociations(s.id),
      collectionReport: report ? { sport: slug, reason_pt: report.reason, facts: report.facts as never } : null,
      isTeamSport: s.isTeamSport,
      categories: cats
        .filter((c) => !c.parentCategoryId)
        .map((c) => ({
          name: this.t.category(c.id, 'name') ?? c.slug,
          children: cats.filter((x) => x.parentCategoryId === c.id).map((x) => this.t.category(x.id, 'name') ?? x.slug),
        })),
      competitions: this.rows.competitions
        .filter((c) => c.sportId === s.id)
        .map((c) => {
          const eds = this.maps.editionsByCompetition.get(c.id) ?? [];
          const edIds = new Set(eds.map((e) => e.id));
          const level = this.maps.levels.get(c.competitionLevelId)!;
          return {
            slug: c.slug,
            name: this.competitionName(c.id),
            level: level.slug,
            levelOrder: level.sortOrder,
            periodicity: c.periodicity,
            org: this.maps.orgs.get(c.organizationId)?.name ?? '?',
            editions: eds.length,
            winnersInDb: new Set(this.rows.achievements.filter((x) => x.competitionEditionId && edIds.has(x.competitionEditionId)).map((x) => x.athleteId)).size,
          };
        })
        .sort((a, b) => a.levelOrder - b.levelOrder),
      athletes: this.athletes({ sport: slug }),
      observances: this.rows.observances.filter((o) => o.sportId === s.id).map((o) => this.observanceView(o)),
      upcoming: this.calendar(today, upcomingTo).filter((e): e is CompetitionEvent => e.type === CalendarEventType.Competition && e.sport.slug === slug),
    };
  }

  // ── calendar, on this day ──
  observanceView(o: R['observances'][number]): Observance {
    const c = this.maps.days.get(o.calendarDayId)!;
    return {
      slug: o.slug,
      md: `${pad2(c.month)}-${pad2(c.day)}`,
      name: this.t.observance(o.id, 'name') ?? o.slug,
      scope: o.scope,
      recognition: o.recognition,
      reference: o.reference,
      country: this.country(o.countryId),
      sport: o.sportId ? this.sportInfo(o.sportId) : null,
    };
  }
  /** Competitions overlapping [from, to] + observances expanded on every year of the range (doc 03). */
  calendar(from: IsoDate, to: IsoDate): CalendarEvent[] {
    const comps: CalendarEvent[] = this.rows.editions
      .filter((e) => e.startDate && e.startDate <= to && (e.endDate ?? e.startDate) >= from)
      .map((e) => {
        const c = this.maps.competitions.get(e.competitionId)!;
        const name = this.competitionName(c.id);
        return {
          type: CalendarEventType.Competition,
          id: e.id,
          name: e.label || `${name} ${e.year}`,
          competition: name,
          start: e.startDate!,
          end: e.endDate ?? e.startDate!,
          status: e.status,
          isExample: e.isExample,
          level: this.maps.levels.get(c.competitionLevelId)!.slug,
          sport: this.sportInfo(c.sportId),
          host: this.country(e.hostCountryId),
        };
      });
    const obs: CalendarEvent[] = [];
    for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
      for (const o of this.rows.observances) {
        const v = this.observanceView(o);
        const date = `${y}-${v.md}`;
        if (date >= from && date <= to) obs.push({ type: CalendarEventType.Observance, date, ...v });
      }
    }
    const start = (e: CalendarEvent) => (e.type === CalendarEventType.Competition ? e.start : e.date);
    return [...comps, ...obs].sort((a, b) => start(a).localeCompare(start(b)));
  }
  /** Reading never creates the calendar day: a day without a row is a day without facts. */
  onThisDay(md: string): OnThisDayResponse {
    const [m, d] = md.split('-').map(Number);
    const cd = this.rows.calendarDays.find((c) => c.month === m && c.day === d);
    if (!cd) return { md, items: [], observance: null };
    const items = this.rows.milestones
      .filter((x) => x.calendarDayId === cd.id && this.maps.athleteSportsByAthlete.has(x.athleteId))
      .map((x) => ({ year: x.year, kind: x.kind, title: this.t.milestone(x.id, 'title') ?? x.kind, athlete: this.summaryById(x.athleteId) }))
      .sort((a, b) => a.year - b.year);
    const obs = this.rows.observances.find((o) => o.calendarDayId === cd.id);
    const found = this.rows.milestones.filter((x) => x.calendarDayId === cd.id).map((x) => this.t.milestone.localeOf(x.id));
    return { md, items, observance: obs ? this.observanceView(obs) : null, contentLocale: contentLocaleOf(this.locale, found) };
  }

  // ── hall of greats, globe, sources ──
  hallOfGreats(): HallOfGreatsEntry[] {
    return this.athletes({ tier: Tier.Mythic }).map((a) => {
      const d = this.dossierOf(a.id);
      return {
        ...a,
        headline: d ? this.t.dossier(d.id, 'headline') : null,
        evidences: d ? this.rows.evidences.filter((e) => e.dossierId === d.id).length : 0,
        approvals: d ? d.approvalsCount : null,
      };
    });
  }
  /** Language of the Hall's texts (dossier headlines). */
  hallContentLocale(): Locale {
    const found = this.athletes({ tier: Tier.Mythic }).map((a) => {
      const d = this.dossierOf(a.id);
      return d ? this.t.dossier.localeOf(d.id) : null;
    });
    return contentLocaleOf(this.locale, found);
  }
  candidates(): AthleteSummary[] {
    return this.athletes({ tier: Tier.Legendary });
  }
  globe(): GlobeCountry[] {
    const out = new Map<string, { c: R['countries'][number]; sports: Map<string, number>; athletes: AthleteRef[] }>();
    for (const a of this.athletes()) {
      const primary = a.nationalities[0];
      const row = primary ? this.rows.countries.find((c) => c.iso2 === primary.iso2) : undefined;
      if (!row?.isoNumeric) continue;
      const entry = out.get(row.id) ?? { c: row, sports: new Map<string, number>(), athletes: [] as AthleteRef[] };
      entry.sports.set(a.sport.id, (entry.sports.get(a.sport.id) ?? 0) + a.titles);
      entry.athletes.push({ slug: a.slug, knownAs: a.knownAs, tier: a.tier });
      out.set(row.id, entry);
    }
    return [...out.values()]
      .map(({ c, sports, athletes }) => {
        const list = [...sports.entries()]
          .map(([id, titles]) => {
            const s = this.sportInfo(id);
            return { sport: { slug: s.slug, name: s.name, colorToken: s.colorToken }, titles };
          })
          .sort((a, b) => b.titles - a.titles);
        const ref = this.country(c.id)!;
        return { isoNumeric: c.isoNumeric!, iso2: c.iso2, name: ref.name, flag: ref.flag, totalTitles: list.reduce((s, x) => s + x.titles, 0), sports: list, athletes };
      })
      .sort((a, b) => b.totalTitles - a.totalTitles);
  }
  sourcesOverview(): SourceOverview[] {
    return this.rows.sources.map((s) => {
      const links = this.rows.sourceLinks.filter((l) => l.sourceId === s.id && l.entityId);
      const linkIds = new Set(links.map((l) => l.id));
      const runs = this.rows.ingestionRuns.filter((r) => r.sourceId === s.id).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
      const lastRun = runs[0];
      const athleteName = (id: string | null) => (id ? (this.maps.athletes.get(id)?.knownAs ?? null) : null);
      return {
        slug: s.slug,
        name: s.name,
        url: s.baseUrl,
        license: s.license,
        originKind: s.originKind,
        commercialUse: s.commercialUse,
        usageStatus: s.usageStatus,
        usageNote: s.usageNote,
        links: links.map((l) => ({
          url: l.url,
          entity: l.entityType,
          revision: l.lastRevision,
          checked: l.lastCheckedAt,
          status: l.lastStatus,
          athlete: l.entityType === 'athletes' ? athleteName(l.entityId) : null,
        })),
        athletes: [...new Set(links.filter((l) => l.entityType === 'athletes').map((l) => athleteName(l.entityId)).filter((n): n is string => !!n))],
        fields: this.rows.provenance.filter((p) => p.sourceLinkId && linkIds.has(p.sourceLinkId)).length,
        achievements: this.rows.achievements.filter((x) => x.sourceLinkId && linkIds.has(x.sourceLinkId)).length,
        lastRun: lastRun
          ? {
              id: lastRun.id,
              jobKey: lastRun.jobKey,
              mode: lastRun.mode,
              startedAt: lastRun.startedAt.toISOString(),
              finishedAt: isoOf(lastRun.finishedAt),
              status: lastRun.status,
              checked: lastRun.checked,
              unchanged: lastRun.unchanged,
              updated: lastRun.updated,
              errors: lastRun.errors,
            }
          : null,
      };
    });
  }
}
