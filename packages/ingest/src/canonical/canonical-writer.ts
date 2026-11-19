// Canonical writer (handoff v3 §6.1, A01/A04/G03): the ONLY layer that writes the domain. Reads observations,
// resolves identities, and get-or-creates through BaseRepository (versioned + audited, actor system:canonical).
// Idempotent: every write is an `ensure` on a natural key. It never approves anything: values it writes are
// `auto_accepted` (deterministic + SoT) and ambiguous identities go to identity_candidates for a human.
import {
  type Actor, BaseRepository, type Database, active, athleteSports, athletes, categoryDimensions, categorySetValues, categorySets, categoryValues, championTiers,
  competitionEditions, competitionEntries, competitionEvents, competitionLevels, competitionResults, competitions, competitionTranslations, competitorRepresentations,
  competitorGroups, competitorMemberships, competitors, contestParticipations, contests, countries, countryTranslations, domainValues, entityAliases, entityExternalIds, entryMembers, fieldConflicts, fieldProvenance,
  identityCandidates, organizationKinds, organizations, recognitionDefinitionTranslations, recognitionDefinitions, recognitionGrants, sourceObservations, sports, teams,
} from '@was/db';
import { DomainKind, type DiscoveredCompetitor, type EntityRef, type EventRecord, type Observation, ObservationSchema, normalizeForSearch } from '@was/shared';
import { and, asc, eq, inArray } from 'drizzle-orm';
import countryCodes from 'i18n-iso-countries';

import { PersonIndex, normalizeName } from '../identity/resolver';
import { BJJ_COMPETITIONS } from '../providers/bjj-champions.provider';
import { FOOTBALL_COMPETITIONS } from '../providers/football-champions.provider';

export const CANONICAL_ACTOR: Actor = { userId: null, name: 'canonical writer', via: 'system:canonical' };

/** Historical / constituent entities met in the sources (C05): kept as they were, never converted to successors. */
const HISTORICAL: Record<string, { code: string; kind: 'historical' | 'constituent'; ioc?: string; fifa?: string; from?: number; to?: number; pt: string; es: string }> = {
  'West Germany': { code: 'frg', kind: 'historical', ioc: 'FRG', fifa: 'FRG', from: 1949, to: 1990, pt: 'Alemanha Ocidental', es: 'Alemania Occidental' },
  'East Germany': { code: 'gdr', kind: 'historical', ioc: 'GDR', fifa: 'GDR', from: 1949, to: 1990, pt: 'Alemanha Oriental', es: 'Alemania Oriental' },
  'Soviet Union': { code: 'urs', kind: 'historical', ioc: 'URS', fifa: 'URS', from: 1922, to: 1991, pt: 'União Soviética', es: 'Unión Soviética' },
  Yugoslavia: { code: 'yug', kind: 'historical', ioc: 'YUG', fifa: 'YUG', from: 1918, to: 2003, pt: 'Iugoslávia', es: 'Yugoslavia' },
  Czechoslovakia: { code: 'tch', kind: 'historical', ioc: 'TCH', fifa: 'TCH', from: 1918, to: 1992, pt: 'Tchecoslováquia', es: 'Checoslovaquia' },
  'Unified Team': { code: 'eun', kind: 'historical', ioc: 'EUN', from: 1992, to: 1992, pt: 'Equipe Unificada', es: 'Equipo Unificado' },
  England: { code: 'eng', kind: 'constituent', fifa: 'ENG', pt: 'Inglaterra', es: 'Inglaterra' },
  'Great Britain': { code: 'gbr', kind: 'constituent', ioc: 'GBR', pt: 'Grã-Bretanha', es: 'Gran Bretaña' },
};
const ALL_COMPETITIONS: Record<string, { org: string; names: readonly string[]; sport: string }> = {
  ...Object.fromEntries(Object.entries(FOOTBALL_COMPETITIONS).map(([k, v]) => [k, { ...v, sport: 'football' }])),
  ...Object.fromEntries(Object.entries(BJJ_COMPETITIONS).map(([k, v]) => [k, { ...v, sport: 'jiu-jitsu' }])),
};
const ORG_NAMES: Record<string, string> = { fifa: 'FIFA', ioc: 'International Olympic Committee', adcc: 'ADCC', ibjjf: 'International Brazilian Jiu-Jitsu Federation' };

const slugify = (s: string) => normalizeForSearch(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const flagOf = (iso2: string) => String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

export interface WriteReport {
  observations: number;
  people: { created: number; matched: number; review: number };
  grants: number;
  entries: number;
  results: number;
  starters: number;
}

export class CanonicalWriter {
  private readonly repo: BaseRepository;
  private people!: PersonIndex;
  private domain = new Map<string, string>();
  private cache = new Map<string, string>();
  private readonly report: WriteReport = { observations: 0, people: { created: 0, matched: 0, review: 0 }, grants: 0, entries: 0, results: 0, starters: 0 };
  /** Persons that must have a public profile (starters of a final, individual champions). */
  private readonly publicPeople = new Set<string>();
  private readonly touchedPeople = new Set<string>();

  constructor(private readonly db: Database) {
    this.repo = new BaseRepository(db);
  }

  private async init() {
    this.people = await PersonIndex.load(this.db);
    for (const d of await this.db.select().from(domainValues).where(active(domainValues))) this.domain.set(`${d.domain}:${d.slug}`, d.id);
  }
  private dv(kind: DomainKind, slug: string) {
    const id = this.domain.get(`${kind}:${slug}`);
    if (!id) throw new Error(`domain value ${kind}:${slug} is not seeded`);
    return id;
  }
  private async memo(key: string, make: () => Promise<string>) {
    const hit = this.cache.get(key);
    if (hit) return hit;
    const id = await make();
    this.cache.set(key, id);
    return id;
  }

  /** Writes every observation of the given providers (oldest first). */
  async writeProviders(providerKeys: string[]): Promise<WriteReport> {
    await this.init();
    const rows = await this.db
      .select()
      .from(sourceObservations)
      .where(active(sourceObservations, inArray(sourceObservations.providerKey, providerKeys)))
      .orderBy(asc(sourceObservations.createdAt));
    // Identities first, then entries, results and participations (a participation needs the entry).
    const order = { competitor: 0, entry: 1, result: 2, participation: 3, recognition: 4, record_mark: 5, evidence: 6 } as const;
    const parsed = rows
      .map((r) => ({ row: r, obs: ObservationSchema.safeParse(r.extracted) }))
      .filter((x) => x.obs.success)
      .sort((a, b) => order[a.obs.data!.contract] - order[b.obs.data!.contract]);
    for (const { row, obs } of parsed) {
      await this.write(row, obs.data!);
      this.report.observations++;
    }
    await this.applyVisibility();
    return this.report;
  }

  private async write(row: typeof sourceObservations.$inferSelect, o: Observation) {
    switch (o.contract) {
      case 'competitor': {
        await this.person(o.record, o.record.sports[0] ?? null, row);
        return;
      }
      case 'entry': {
        const { eventId, editionId, sportSlug } = await this.event(o.record.event);
        const teamId = await this.team(o.record.competitor, sportSlug);
        const representationId = o.record.representation ? await this.country(o.record.representation.name) : null;
        const entryId = await this.entry(editionId, eventId, teamId, representationId, row);
        for (const m of o.record.members) {
          const personId = await this.person({ ...m.person, kind: 'person', sports: [sportSlug], aliases: [], members: [], birthDate: null, gender: genderOf(o.record.event) }, sportSlug, row);
          if (!personId) continue;
          await this.repo.ensure(entryMembers, { entryId, personId }, {
            entryId, personId, registrationStatusId: this.dv(DomainKind.EntryStatus, m.status), appearanceId: this.dv(DomainKind.Appearance, m.appearance),
            // Fjelstul squads are official: verified; Wikipedia-only squads stay provisional until an admin reviews them.
            verification: m.person.externalIds.fjelstul ? 'verified' : 'provisional',
          } as never, CANONICAL_ACTOR);
          if (representationId) await this.represent(personId, representationId);
        }
        return;
      }
      case 'result': {
        const { eventId, editionId, sportSlug, competitionId, competitionSlug, year } = await this.event(o.record.event);
        const competitorId =
          o.record.competitor.kind === 'person' ? await this.person(o.record.competitor, sportSlug, row)
          : o.record.competitor.kind === 'group' ? await this.group(o.record.competitor, sportSlug, row)
          : await this.team(o.record.competitor, sportSlug);
        if (!competitorId) return;
        const entryId = await this.entry(editionId, eventId, competitorId, null, row);
        const result = await this.repo.ensure(competitionResults, { scope: 'event', scopeId: eventId, entryId }, {
          scope: 'event', scopeId: eventId, entryId, rank: o.record.rank, rankTied: o.record.tied, statusId: this.dv(DomainKind.ResultStatus, o.record.status),
        } as never, CANONICAL_ACTOR);
        this.report.results++;
        if (o.record.competitor.kind === 'group') {
          for (const m of o.record.competitor.members) {
            const personId = await this.person(m.person as DiscoveredCompetitor, sportSlug, row);
            if (personId) await this.repo.ensure(entryMembers, { entryId, personId }, { entryId, personId, registrationStatusId: this.dv(DomainKind.EntryStatus, 'registered'), appearanceId: this.dv(DomainKind.Appearance, 'appeared'), verification: 'provisional' } as never, CANONICAL_ACTOR);
          }
        }
        if (o.record.rank !== null && o.record.rank <= 3 && competitionSlug === 'olympic-games-summer') {
          // Olympic medals (F03): gold/silver/bronze grants to the competitor and to every member of a relay/team.
          const definitionId = await this.medalDefinition(competitionId, sportSlug, o.record.event.event.label);
          const level = this.dv(DomainKind.RecognitionLevel, ['gold', 'silver', 'bronze'][o.record.rank - 1]!);
          const members = o.record.competitor.kind === 'group' ? await this.db.select().from(entryMembers).where(active(entryMembers, eq(entryMembers.entryId, entryId))) : [];
          for (const [who, via] of [[competitorId, null] as const, ...members.map((m) => [m.personId, competitorId] as const)]) {
            await this.repo.ensure(recognitionGrants, { definitionId, competitorId: who, resultId: result.id }, {
              definitionId, competitorId: who, viaCompetitorId: via, resultId: result.id, levelId: level, rank: o.record.rank, year, statusId: this.dv(DomainKind.GrantStatus, 'granted'),
            } as never, CANONICAL_ACTOR);
            this.report.grants++;
            if (who !== competitorId || o.record.competitor.kind === 'person') this.publicPeople.add(who);
          }
        } else if (o.record.rank === 1) {
          const definitionId = await this.definition(competitionId, competitionSlug, sportSlug);
          const grant = async (personOrTeam: string, via: string | null) => {
            await this.repo.ensure(recognitionGrants, { definitionId, competitorId: personOrTeam, resultId: result.id }, {
              definitionId, competitorId: personOrTeam, viaCompetitorId: via, resultId: result.id, levelId: this.dv(DomainKind.RecognitionLevel, 'winner'), rank: 1, year, statusId: this.dv(DomainKind.GrantStatus, 'granted'),
            } as never, CANONICAL_ACTOR);
            this.report.grants++;
          };
          await grant(competitorId, null);
          if (o.record.competitor.kind === 'team') {
            // Every registered member of the champion squad holds the title through the team (F01: credit ≠ appearance).
            const members = await this.db.select().from(entryMembers).where(active(entryMembers, eq(entryMembers.entryId, entryId)));
            for (const m of members) await grant(m.personId, competitorId);
          } else {
            this.publicPeople.add(competitorId);
          }
        }
        await this.provenance('recognition_grants', result.id, 'result', row);
        return;
      }
      case 'participation': {
        const { eventId, editionId, sportSlug } = await this.event(o.record.event);
        const teamId = await this.team({ ...o.record.competitor, kind: 'team', sports: [sportSlug], aliases: [], members: [], birthDate: null, gender: null }, sportSlug);
        const entryId = await this.entry(editionId, eventId, teamId, null, row);
        const personId = await this.person({ ...o.record.person, kind: 'person', sports: [sportSlug], aliases: [], members: [], birthDate: null, gender: genderOf(o.record.event) }, sportSlug, row);
        if (!personId) return;
        const contest = await this.repo.ensure(contests, { eventId, label: o.record.contest.label }, { eventId, label: o.record.contest.label, sequence: o.record.contest.sequence } as never, CANONICAL_ACTOR);
        await this.repo.ensure(contestParticipations, { contestId: contest.id, personId }, { contestId: contest.id, entryId, personId, roleId: this.dv(DomainKind.ParticipationRole, o.record.role) } as never, CANONICAL_ACTOR);
        // A starter of a final who is not in the squad yet (Wikipedia lineups of pre-1970 finals) joins it.
        await this.repo.ensure(entryMembers, { entryId, personId }, {
          entryId, personId, registrationStatusId: this.dv(DomainKind.EntryStatus, 'registered'), appearanceId: this.dv(DomainKind.Appearance, 'appeared'), verification: 'provisional',
        } as never, CANONICAL_ACTOR);
        if (o.record.role === 'starter' && o.record.contest.label === 'Final') this.publicPeople.add(personId);
        this.report.starters++;
        return;
      }
      case 'evidence': {
        await this.applyEvidence(o.record, row);
        return;
      }
      default:
        return;
    }
  }

  /** Wikidata facts (§5.2: Wikidata is the SoT for birth and ids): fill empty fields; a different value opens a conflict. */
  private async applyEvidence(e: Extract<Observation, { contract: 'evidence' }>['record'], row: typeof sourceObservations.$inferSelect) {
    const [entityId, field] = e.field.split(':') as [string, string];
    const [person] = await this.db.select().from(athletes).where(eq(athletes.id, entityId));
    if (!person) return;
    const value = e.value.value;
    if (field === 'wikidata' && typeof value === 'string') {
      await this.repo.ensure(entityExternalIds, { provider: 'wikidata', externalId: value }, { entityId, provider: 'wikidata', externalId: value, url: `https://www.wikidata.org/wiki/${value}` } as never, CANONICAL_ACTOR);
      if (!person.wikidataQid) await this.repo.update(athletes, entityId, { wikidataQid: value } as never, CANONICAL_ACTOR, { summary: 'Wikidata QID (sitelink)' });
      return;
    }
    const column = field === 'birth_date' ? 'birthDate' : field === 'birth_year' ? 'birthYear' : field === 'gender' ? 'gender' : null;
    if (!column) return;
    const current = (person as Record<string, unknown>)[column];
    if (current === null || current === undefined || current === '') {
      await this.repo.update(athletes, entityId, { [column]: value } as never, CANONICAL_ACTOR, { summary: `${column} from Wikidata` });
      await this.provenance('athletes', entityId, column, row);
    } else if (String(current) !== String(value)) {
      await this.repo.ensure(fieldConflicts, { entityType: 'athletes', entityId, fieldName: column, otherValue: String(value) } as never, {
        entityType: 'athletes', entityId, fieldName: column, baseValue: String(current), chosenValue: String(current), otherValue: String(value), resolution: 'pending',
      } as never, CANONICAL_ACTOR);
    }
  }

  private async group(c: DiscoveredCompetitor, sport: string, row: typeof sourceObservations.$inferSelect) {
    return this.memo(`group:${c.recordKey}`, async () => {
      const slug = slugify(c.recordKey.replace(/^group:/, ''));
      const g = await this.repo.ensure(competitorGroups, { slug }, { slug, name: c.name, groupKindId: this.dv(DomainKind.GroupKind, 'relay_team') } as never, CANONICAL_ACTOR);
      await this.db.update(competitors).set({ profileVisibility: 'none', visibilityReason: 'ad hoc group (relay/team of one event)' }).where(eq(competitors.id, g.id));
      for (const m of c.members) {
        const personId = await this.person(m.person as DiscoveredCompetitor, sport, row);
        if (personId) await this.repo.ensure(competitorMemberships, { memberId: personId, parentId: g.id }, { memberId: personId, parentId: g.id, roleId: this.dv(DomainKind.MembershipRole, 'member') } as never, CANONICAL_ACTOR);
      }
      return g.id;
    });
  }

  private async medalDefinition(competitionId: string, sportSlug: string, eventLabel: string) {
    return this.memo(`medal:${sportSlug}:${eventLabel}`, async () => {
      const slug = `olympic-medal--${sportSlug}--${slugify(eventLabel)}`;
      const def = await this.repo.ensure(recognitionDefinitions, { slug }, { slug, kindId: this.dv(DomainKind.RecognitionKind, 'medal'), competitionId, sportId: await this.sportId(sportSlug) } as never, CANONICAL_ACTOR);
      await this.repo.ensure(recognitionDefinitionTranslations, { definitionId: def.id, locale: 'en' }, { definitionId: def.id, locale: 'en', name: `Olympic medal · ${eventLabel}` } as never, CANONICAL_ACTOR);
      return def.id;
    });
  }

  // ── identities ──
  private async person(c: DiscoveredCompetitor, sport: string | null, row: typeof sourceObservations.$inferSelect): Promise<string | null> {
    const externalIds = Object.fromEntries(Object.entries(c.externalIds).filter(([, v]) => v));
    const decision = this.people.resolve({ name: c.name, externalIds, sport, birthDate: c.birthDate });
    let id: string;
    if (decision.kind === 'match') {
      id = decision.entityId;
      this.report.people.matched++;
    } else if (decision.kind === 'review') {
      // Ambiguous: a human decides (never merged on a name). The observation waits in the identity queue.
      await this.repo.ensure(identityCandidates, { observationId: row.id }, {
        observationId: row.id, discoveredName: c.name, proposedEntityId: decision.candidates[0]!.entityId, confidence: decision.candidates[0]!.confidence,
        evidence: { candidates: decision.candidates, externalIds, sport } as never, status: 'pending',
      } as never, CANONICAL_ACTOR);
      this.report.people.review++;
      return null;
    } else {
      id = await this.createPerson(c, externalIds);
      this.report.people.created++;
    }
    for (const [provider, value] of Object.entries(externalIds)) {
      await this.repo.ensure(entityExternalIds, { provider, externalId: value }, { entityId: id, provider, externalId: value, url: provider === 'wikipedia_en' ? `https://en.wikipedia.org/wiki/${encodeURIComponent(value.replaceAll(' ', '_'))}` : null } as never, CANONICAL_ACTOR);
      this.people.addExternal(id, provider, value);
    }
    for (const a of c.aliases) {
      const kindId = this.domain.get(`${DomainKind.NameKind}:${a.kind}`);
      if (kindId) await this.repo.ensure(entityAliases, { entityId: id, normalized: normalizeName(a.name), kindId }, { entityId: id, name: a.name, normalized: normalizeName(a.name), kindId, locale: a.locale } as never, CANONICAL_ACTOR);
    }
    if (sport) await this.sportLink(id, sport);
    this.touchedPeople.add(id);
    return id;
  }

  private async createPerson(c: DiscoveredCompetitor, externalIds: Record<string, string>) {
    const displayName = (externalIds.wikipedia_en ?? c.name).replace(/ \((?:footballer|soccer|grappler|fighter|martial artist|jiu-jitsu|BJJ)[^)]*\)$/i, '').replace(/ \(.*\)$/, '') || c.name;
    const name = c.name.length > 2 ? c.name : displayName;
    let slug = slugify(displayName);
    for (let i = 2; (await this.db.select({ id: athletes.id }).from(athletes).where(active(athletes, eq(athletes.slug, slug)))).length; i++) slug = `${slugify(displayName)}-${i}`;
    const tierId = await this.memo('tier:champion', async () => (await this.db.select().from(championTiers).where(eq(championTiers.slug, 'champion')))[0]!.id);
    const row = await this.repo.insert(athletes, { slug, knownAs: name, gender: c.gender ?? null, status: 'unknown', championTierId: tierId } as never, CANONICAL_ACTOR);
    // New people start without a public page; the visibility pass opens the eligible ones (C02).
    await this.db.update(competitors).set({ profileVisibility: 'none', visibilityReason: 'pending visibility rule' }).where(eq(competitors.id, row.id));
    await this.repo.ensure(entityAliases, { entityId: row.id, normalized: normalizeName(name), kindId: this.dv(DomainKind.NameKind, 'display') }, {
      entityId: row.id, name, normalized: normalizeName(name), kindId: this.dv(DomainKind.NameKind, 'display'),
    } as never, CANONICAL_ACTOR);
    this.people.add(row.id, { names: [name], externalIds: {}, sports: [], birthDate: null });
    return row.id;
  }

  private async sportLink(personId: string, sport: string) {
    const sportId = await this.sportId(sport);
    await this.repo.ensure(athleteSports, { athleteId: personId, sportId }, { athleteId: personId, sportId } as never, CANONICAL_ACTOR);
    this.people.addSport(personId, sport);
  }

  private async team(c: DiscoveredCompetitor | EntityRef, sport: string) {
    const gender = c.recordKey.includes(':women:') ? 'women' : 'men';
    return this.memo(`team:${c.recordKey}`, async () => {
      const countryId = await this.country(c.name);
      const slug = `${slugify(c.name)}-${gender}-${sport}`;
      const name = `${c.name} ${gender === 'women' ? "women's" : "men's"} national ${sport === 'football' ? 'football' : sport} team`;
      const row = await this.repo.ensure(teams, { slug }, { slug, name, kind: 'national', sportId: await this.sportId(sport), countryId } as never, CANONICAL_ACTOR);
      await this.db.update(competitors).set({ profileVisibility: 'none', visibilityReason: 'teams have no profile page yet' }).where(eq(competitors.id, row.id));
      return row.id;
    });
  }

  /** Country by English name; historical entities (USSR, West Germany…) are created as such (C05). */
  private async country(name: string) {
    return this.memo(`country:${name}`, async () => {
      const historical = HISTORICAL[name];
      const iso2 = historical ? null : countryCodes.getAlpha2Code(name === 'United States' ? 'United States of America' : name, 'en') ?? null;
      const code = historical?.code ?? iso2?.toLowerCase() ?? slugify(name);
      const [found] = await this.db.select().from(countries).where(active(countries, iso2 ? eq(countries.iso2, iso2) : eq(countries.code, code)));
      if (found) return found.id;
      const row = await this.repo.insert(countries, {
        iso2, code, kind: historical?.kind ?? (iso2 ? 'sovereign' : 'territory'), flagEmoji: iso2 ? flagOf(iso2) : null, iocCode: historical?.ioc ?? null, fifaCode: historical?.fifa ?? null,
        validFromYear: historical?.from ?? null, validToYear: historical?.to ?? null, isoNumeric: iso2 ? countryCodes.alpha2ToNumeric(iso2) ?? null : null,
      } as never, CANONICAL_ACTOR);
      const names: [string, string][] = [['en', name], ['pt-BR', historical?.pt ?? (iso2 ? countryCodes.getName(iso2, 'pt') ?? name : name)], ['es', historical?.es ?? (iso2 ? countryCodes.getName(iso2, 'es') ?? name : name)]];
      for (const [locale, n] of names) await this.repo.ensure(countryTranslations, { countryId: row.id, locale }, { countryId: row.id, locale, name: n } as never, CANONICAL_ACTOR);
      return row.id;
    });
  }

  private async represent(personId: string, countryId: string) {
    await this.repo.ensure(competitorRepresentations, { competitorId: personId, representationId: countryId, contextId: this.dv(DomainKind.RepresentationContext, 'sporting_representation') }, {
      competitorId: personId, representationId: countryId, contextId: this.dv(DomainKind.RepresentationContext, 'sporting_representation'),
    } as never, CANONICAL_ACTOR);
  }

  // ── structure ──
  private sportId(slug: string) {
    return this.memo(`sport:${slug}`, async () => {
      const [s] = await this.db.select().from(sports).where(active(sports, eq(sports.slug, slug)));
      if (!s) throw new Error(`sport ${slug} missing (run the seed)`);
      return s.id;
    });
  }

  private async organization(slug: string) {
    return this.memo(`org:${slug}`, async () => {
      const [found] = await this.db.select().from(organizations).where(active(organizations, eq(organizations.slug, slug)));
      if (found) return found.id;
      const kind = (await this.db.select().from(organizationKinds).where(eq(organizationKinds.slug, 'federation')))[0]!;
      const world = (await this.db.select().from(competitionLevels).where(eq(competitionLevels.slug, 'world')))[0]!;
      return (await this.repo.insert(organizations, { slug, name: ORG_NAMES[slug] ?? slug.toUpperCase(), organizationKindId: kind.id, scopeLevelId: world.id } as never, CANONICAL_ACTOR)).id;
    });
  }

  private async event(e: EventRecord) {
    const competitionSlug = e.competition.recordKey.replace(/^competition:/, '');
    const meta = ALL_COMPETITIONS[competitionSlug];
    const sportSlug = e.event.discipline ?? e.sport;
    const competitionId = await this.memo(`competition:${competitionSlug}`, async () => {
      const [found] = await this.db.select().from(competitions).where(active(competitions, eq(competitions.slug, competitionSlug)));
      if (found) return found.id;
      const world = (await this.db.select().from(competitionLevels).where(eq(competitionLevels.slug, 'world')))[0]!;
      const row = await this.repo.insert(competitions, {
        slug: competitionSlug, sportId: await this.sportId(meta?.sport ?? e.sport), organizationId: await this.organization(meta?.org ?? 'unknown'), competitionLevelId: world.id,
        isOlympic: competitionSlug.startsWith('olympic'), formatId: this.dv(DomainKind.CompetitionFormat, e.event.format),
      } as never, CANONICAL_ACTOR);
      const names = meta?.names ?? [e.competition.name, e.competition.name, e.competition.name];
      for (const [i, locale] of (['en', 'pt-BR', 'es'] as const).entries()) await this.repo.ensure(competitionTranslations, { competitionId: row.id, locale }, { competitionId: row.id, locale, name: names[i]! } as never, CANONICAL_ACTOR);
      return row.id;
    });
    const year = e.edition?.year ?? null;
    const editionId = await this.memo(`edition:${competitionSlug}:${year}`, async () => {
      const [found] = await this.db.select().from(competitionEditions).where(active(competitionEditions, and(eq(competitionEditions.competitionId, competitionId), eq(competitionEditions.year, year!))));
      if (found) return found.id;
      return (await this.repo.insert(competitionEditions, { competitionId, year, label: e.edition?.label ?? null, editionKindId: this.dv(DomainKind.EditionKind, e.edition?.kind ?? 'edition') } as never, CANONICAL_ACTOR)).id;
    });
    const categorySetId = await this.categorySet(competitionSlug, e.event.categories, sportSlug);
    const eventId = await this.memo(`event:${editionId}:${e.event.label}`, async () =>
      (await this.repo.ensure(competitionEvents, { editionId, label: e.event.label }, {
        editionId, label: e.event.label, sportId: await this.sportId(sportSlug), formatId: this.dv(DomainKind.CompetitionFormat, e.event.format), compositionId: this.dv(DomainKind.EntryComposition, e.event.composition), categorySetId,
      } as never, CANONICAL_ACTOR)).id,
    );
    return { eventId, editionId, sportSlug, competitionId, competitionSlug, year };
  }

  /** Category set of an event: values AS THE ORGANIZATION NAMES THEM (no implicit equivalence, §4.2). */
  private async categorySet(competitionSlug: string, categories: Record<string, string>, sport: string) {
    const pairs = Object.entries(categories).sort(([a], [b]) => a.localeCompare(b));
    if (!pairs.length) return null;
    const setSlug = `${competitionSlug}:${pairs.map(([d, v]) => `${d}=${slugify(v)}`).join(',')}`;
    return this.memo(`catset:${setSlug}`, async () => {
      const set = await this.repo.ensure(categorySets, { slug: setSlug }, { slug: setSlug, label: pairs.map(([, v]) => v).join(' · ') } as never, CANONICAL_ACTOR);
      for (const [dimension, value] of pairs) {
        const dimensionId = await this.memo(`dim:${dimension}`, async () => (await this.repo.ensure(categoryDimensions, { slug: dimension }, { slug: dimension, valueType: dimension === 'weight' || dimension === 'belt' ? 'ordinal' : 'label' } as never, CANONICAL_ACTOR)).id);
        const valueSlug = slugify(value) || value;
        const scoped = dimension === 'weight' || dimension === 'belt';
        const orgId = scoped ? await this.organization(ALL_COMPETITIONS[competitionSlug]?.org ?? 'unknown') : null;
        const valueId = await this.memo(`catval:${dimension}:${valueSlug}:${orgId}`, async () => {
          const [found] = await this.db.select().from(categoryValues).where(active(categoryValues, and(eq(categoryValues.dimensionId, dimensionId), eq(categoryValues.slug, valueSlug))));
          if (found && (found.organizationId ?? null) === orgId) return found.id;
          const kg = /([+-]?)(\d+(?:\.\d+)?)\s*kg/i.exec(value);
          return (await this.repo.insert(categoryValues, {
            dimensionId, slug: valueSlug, originalLabel: value, organizationId: orgId, unit: kg ? 'kg' : null,
            max: kg && kg[1] !== '+' ? Number(kg[2]) : null, min: kg && kg[1] === '+' ? Number(kg[2]) : null,
          } as never, CANONICAL_ACTOR)).id;
        });
        await this.repo.ensure(categorySetValues, { setId: set.id, valueId }, { setId: set.id, valueId } as never, CANONICAL_ACTOR);
      }
      void sport;
      return set.id;
    });
  }

  private async entry(editionId: string, eventId: string, competitorId: string, representationId: string | null, row: typeof sourceObservations.$inferSelect) {
    return this.memo(`entry:${eventId}:${competitorId}`, async () => {
      const e = await this.repo.ensure(competitionEntries, { editionId, eventId, competitorId }, { editionId, eventId, competitorId, representationId, statusId: this.dv(DomainKind.EntryStatus, 'registered') } as never, CANONICAL_ACTOR);
      this.report.entries++;
      await this.provenance('competition_entries', e.id, 'entry', row);
      return e.id;
    });
  }

  private async definition(competitionId: string, competitionSlug: string, sportSlug: string) {
    return this.memo(`def:${competitionSlug}`, async () => {
      const slug = `${competitionSlug}--championship_title`;
      const def = await this.repo.ensure(recognitionDefinitions, { slug }, { slug, kindId: this.dv(DomainKind.RecognitionKind, 'championship_title'), competitionId, sportId: await this.sportId(sportSlug) } as never, CANONICAL_ACTOR);
      const names = ALL_COMPETITIONS[competitionSlug]?.names;
      if (names) for (const [i, locale] of (['en', 'pt-BR', 'es'] as const).entries()) await this.repo.ensure(recognitionDefinitionTranslations, { definitionId: def.id, locale }, { definitionId: def.id, locale, name: names[i]! } as never, CANONICAL_ACTOR);
      return def.id;
    });
  }

  /** field_provenance: observation → document → (SoT rule) for the value the writer accepted. Never `approved` (G03). */
  private async provenance(entityType: string, entityId: string, fieldName: string, row: typeof sourceObservations.$inferSelect) {
    await this.repo.ensure(fieldProvenance, { entityType, entityId, fieldName, observationId: row.id } as never, {
      entityType, entityId, fieldName, observationId: row.id, documentId: row.documentId, extractionMethod: 'parser', confidence: row.confidence, reviewStatus: 'auto_accepted', isCurrent: true,
    } as never, CANONICAL_ACTOR);
  }

  /** C02/F02: a person gets a public page only when eligible (final starter, individual champion); never hides existing ones. */
  private async applyVisibility() {
    for (const id of this.touchedPeople) {
      const [c] = await this.db.select().from(competitors).where(eq(competitors.id, id));
      if (!c) continue;
      if (this.publicPeople.has(id) && c.profileVisibility !== 'public') {
        await this.db.update(competitors).set({ profileVisibility: 'public', visibilityReason: 'final starter or individual champion' }).where(eq(competitors.id, id));
      } else if (!this.publicPeople.has(id) && c.visibilityReason === 'pending visibility rule') {
        await this.db.update(competitors).set({ visibilityReason: 'squad member without a final start: listed in squads and rankings only' }).where(eq(competitors.id, id));
      }
    }
  }
}

const genderOf = (e: EventRecord): 'male' | 'female' | null => (e.event.categories.sex_category === 'women' ? 'female' : e.event.categories.sex_category === 'men' ? 'male' : null);
