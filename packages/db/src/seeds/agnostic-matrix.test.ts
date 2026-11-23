// Agnosticity acceptance matrix (handoff v3 §12): 14 very different cases are written into the SAME universal
// tables using only domain data (vocabulary values, dimensions, metrics, registered extensions). If one of them
// needed a new column, enum or sport-specific table, this test could not be written — that is the criterion.
import { DomainKind } from '@was/shared';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase } from '../client';
import type { Actor } from '../interfaces/actor.interface';
import type { DatabaseHandle } from '../interfaces/database-handle.interface';
import { BaseRepository } from '../repositories/base.repository';
import * as T from '../schema';
import { seedDatabase } from './seed';

const actor: Actor = { userId: null, name: 'matrix', via: 'system:test' };

describe('agnosticity matrix: 14 cases in the universal model, no schema change (handoff v3 §12)', () => {
  let h: DatabaseHandle;
  let repo: BaseRepository;
  const dv = new Map<string, string>();
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
    await seedDatabase(h.db, '/nonexistent'); // config + vocabulary only
    repo = new BaseRepository(h.db);
    for (const d of await h.db.select().from(T.domainValues)) dv.set(`${d.domain}:${d.slug}`, d.id);
    const one = async <R>(p: Promise<R[]>) => (await p)[0]!;
    ids.world = (await one(h.db.select().from(T.competitionLevels).where(eq(T.competitionLevels.slug, 'world')))).id;
    ids.tier = (await one(h.db.select().from(T.championTiers).where(eq(T.championTiers.slug, 'champion')))).id;
    const group = await repo.insert(T.sportGroups, { slug: 'physical', sortOrder: 1 } as never, actor);
    ids.subgroup = (await repo.insert(T.sportSubgroups, { groupId: group.id, slug: 'all', sortOrder: 1 } as never, actor)).id;
    const kind = await repo.insert(T.organizationKinds, { slug: 'community', nature: 'community', sortOrder: 1 } as never, actor);
    ids.orgKind = kind.id;
  });
  afterAll(() => h.close());

  const d = (kind: DomainKind, slug: string) => dv.get(`${kind}:${slug}`)!;
  const sport = (slug: string) =>
    repo.ensure(
      T.sports,
      { slug } as never,
      { slug, subgroupId: ids.subgroup, statsSchemaKey: 'generic', colorToken: '--primary', environment: 'open', format: 'individual' } as never,
      actor,
    );
  const org = (slug: string) =>
    repo.ensure(T.organizations, { slug } as never, { slug, name: slug, organizationKindId: ids.orgKind, scopeLevelId: ids.world } as never, actor);
  const person = (slug: string) => repo.insert(T.athletes, { slug, knownAs: slug, status: 'unknown', championTierId: ids.tier } as never, actor);
  const competition = async (slug: string, sportSlug: string | null, orgSlug: string) =>
    repo.insert(
      T.competitions,
      {
        slug,
        sportId: sportSlug ? (await sport(sportSlug)).id : null,
        organizationId: (await org(orgSlug)).id,
        competitionLevelId: ids.world,
        isMultiSport: !sportSlug,
      } as never,
      actor,
    );
  const edition = (competitionId: string, year: number | null, kind = 'edition', label?: string) =>
    repo.insert(T.competitionEditions, { competitionId, year, label: label ?? String(year), editionKindId: d(DomainKind.EditionKind, kind) } as never, actor);
  const event = async (editionId: string, sportSlug: string, label: string, format: string, composition: string, categorySetId: string | null = null) =>
    repo.insert(
      T.competitionEvents,
      {
        editionId,
        sportId: (await sport(sportSlug)).id,
        label,
        formatId: d(DomainKind.CompetitionFormat, format),
        compositionId: d(DomainKind.EntryComposition, composition),
        categorySetId,
      } as never,
      actor,
    );
  const entry = (editionId: string, eventId: string | null, competitorId: string, representationId: string | null = null) =>
    repo.insert(
      T.competitionEntries,
      { editionId, eventId, competitorId, representationId, statusId: d(DomainKind.EntryStatus, 'registered') } as never,
      actor,
    );
  const result = (
    scope: string,
    scopeId: string,
    entryId: string,
    rank: number | null,
    status: string,
    extension?: { schemaId: string; data: Record<string, unknown> },
  ) =>
    repo.insert(
      T.competitionResults,
      {
        scope,
        scopeId,
        entryId,
        rank,
        statusId: d(DomainKind.ResultStatus, status),
        ...(extension ? { extensionSchemaId: extension.schemaId, extension: extension.data } : {}),
      } as never,
      actor,
    );
  const metric = async (slug: string, valueType: string, unit: string | null, better: string) =>
    repo.ensure(T.metricDefinitions, { slug } as never, { slug, valueType, unit, better } as never, actor);
  const measure = async (resultId: string, slug: string, valueType: string, unit: string | null, better: string, value: number | null, original: string) =>
    repo.insert(
      T.resultMetrics,
      { resultId, metricId: (await metric(slug, valueType, unit, better)).id, valueNumeric: value, unitOriginal: unit, valueOriginal: original } as never,
      actor,
    );
  const categorySet = async (slug: string, pairs: [string, string, string | null][]) => {
    const set = await repo.insert(T.categorySets, { slug, label: slug } as never, actor);
    for (const [dimension, value, orgId] of pairs) {
      const dim = await repo.ensure(T.categoryDimensions, { slug: dimension } as never, { slug: dimension, valueType: 'label' } as never, actor);
      const slug = `${value}-${orgId ?? 'x'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const val = await repo.ensure(
        T.categoryValues,
        { dimensionId: dim.id, slug } as never,
        { dimensionId: dim.id, slug, originalLabel: value, organizationId: orgId } as never,
        actor,
      );
      await repo.insert(T.categorySetValues, { setId: set.id, valueId: val.id } as never, actor);
    }
    return set.id;
  };
  const definition = async (slug: string, kind: string, competitionId: string | null, issuer: string | null = null, metricId: string | null = null) =>
    repo.insert(T.recognitionDefinitions, { slug, kindId: d(DomainKind.RecognitionKind, kind), competitionId, issuerOrgId: issuer, metricId } as never, actor);
  const grant = (definitionId: string, competitorId: string, extra: Record<string, unknown> = {}) =>
    repo.insert(T.recognitionGrants, { definitionId, competitorId, statusId: d(DomainKind.GrantStatus, 'granted'), ...extra } as never, actor);
  const extension = (key: string) => repo.insert(T.extensionSchemas, { key, jsonSchema: { type: 'object' } } as never, actor);

  it('1 · athletics 100 m: heats (stages), time with original value, shared bronze (tie)', async () => {
    const og = await competition('olympic-games-summer', null, 'ioc');
    const ed = await edition(og.id, 2024);
    const heat = await repo.insert(T.competitionStages, { editionId: ed.id, stageKindId: d(DomainKind.StageKind, 'heat'), label: 'Heat 1' } as never, actor);
    const ev = await event(
      ed.id,
      'athletics',
      "Men's 100 metres",
      'race_measured',
      'individual',
      await categorySet('athletics-100m-men', [
        ['distance', '100 m', null],
        ['sex_category', 'men', null],
      ]),
    );
    const runners = await Promise.all(['lyles', 'thompson', 'kerley', 'bronze-twin'].map(person));
    const def = await definition('olympic-medal-athletics-100m', 'medal', og.id);
    for (const [i, r] of runners.entries()) {
      const en = await entry(ed.id, ev.id, r.id);
      const rank = i === 3 ? 3 : i + 1; // two bronzes
      const res = await repo.insert(
        T.competitionResults,
        { scope: 'event', scopeId: ev.id, entryId: en.id, rank, rankTied: rank === 3, statusId: d(DomainKind.ResultStatus, 'finished') } as never,
        actor,
      );
      await measure(res.id, 'time', 'duration', 's', 'lower', 9.79 + i / 100, `9.7${9 + i}`);
      await grant(def.id, r.id, {
        resultId: res.id,
        rank,
        levelId: d(DomainKind.RecognitionLevel, ['gold', 'silver', 'bronze', 'bronze'][i]!),
        shared: rank === 3,
      });
    }
    expect(heat.id).toBeTruthy();
    expect((await h.db.select().from(T.recognitionGrants).where(eq(T.recognitionGrants.shared, true))).length).toBe(2);
  });

  it('2 · 4×100 m relay: a group competitor, members per leg, a heats-only swimmer also medals', async () => {
    const [og] = await h.db.select().from(T.competitions).where(eq(T.competitions.slug, 'olympic-games-summer'));
    const [ed] = await h.db.select().from(T.competitionEditions).where(eq(T.competitionEditions.competitionId, og!.id));
    const ev = await event(ed!.id, 'swimming', "Men's 4 × 100 m freestyle relay", 'race_measured', 'relay');
    const relay = await repo.insert(
      T.competitorGroups,
      { slug: 'usa-4x100-2024', name: 'United States 4×100', groupKindId: d(DomainKind.GroupKind, 'relay_team') } as never,
      actor,
    );
    const en = await entry(ed!.id, ev.id, relay.id);
    const swimmers = await Promise.all(['dressel', 'casas', 'alexy', 'king', 'heats-only'].map(person));
    for (const [i, s] of swimmers.entries()) {
      await repo.insert(
        T.entryMembers,
        {
          entryId: en.id,
          personId: s.id,
          roleId: d(DomainKind.ParticipationRole, i < 4 ? `leg_${i + 1}` : 'heat_only'),
          registrationStatusId: d(DomainKind.EntryStatus, 'registered'),
          appearanceId: d(DomainKind.Appearance, 'appeared'),
        } as never,
        actor,
      );
    }
    const res = await result('event', ev.id, en.id, 1, 'finished');
    const def = await definition('olympic-medal-swimming-4x100', 'medal', og!.id);
    for (const s of swimmers) await grant(def.id, s.id, { resultId: res.id, viaCompetitorId: relay.id, levelId: d(DomainKind.RecognitionLevel, 'gold') });
    expect((await h.db.select().from(T.recognitionGrants).where(eq(T.recognitionGrants.viaCompetitorId, relay.id))).length).toBe(5);
  });

  it('3 · football 2002: team, squad, final contest with starters, title; only starters get a profile', async () => {
    const wc = await competition('fifa-world-cup', 'football', 'fifa');
    const ed = await edition(wc.id, 2002);
    const ev = await event(ed.id, 'football', "Men's tournament", 'group_and_knockout', 'team');
    const brazil = await repo.insert(T.teams, { slug: 'brazil-men', name: 'Brazil', kind: 'national' } as never, actor);
    const en = await entry(ed.id, ev.id, brazil.id);
    const final = await repo.insert(T.contests, { eventId: ev.id, label: 'Final', sequence: 64 } as never, actor);
    const [starter, reserve] = await Promise.all([person('cafu'), person('reserve-gk')]);
    for (const p of [starter, reserve])
      await repo.insert(
        T.entryMembers,
        {
          entryId: en.id,
          personId: p.id,
          registrationStatusId: d(DomainKind.EntryStatus, 'registered'),
          appearanceId: d(DomainKind.Appearance, p === starter ? 'appeared' : 'did_not_appear'),
          verification: 'verified',
        } as never,
        actor,
      );
    await repo.insert(
      T.contestParticipations,
      { contestId: final.id, entryId: en.id, personId: starter.id, roleId: d(DomainKind.ParticipationRole, 'starter') } as never,
      actor,
    );
    await h.db.update(T.competitors).set({ profileVisibility: 'none' }).where(eq(T.competitors.id, reserve.id));
    expect((await h.db.select().from(T.competitors).where(eq(T.competitors.id, reserve.id)))[0]?.profileVisibility).toBe('none');
  });

  it('4 · BJJ: divisions of IBJJF and ADCC as each names them + an explicit (not implicit) mapping', async () => {
    const ibjjf = await org('ibjjf');
    const adcc = await org('adcc');
    const a = await categorySet('ibjjf-black-76', [
      ['belt', 'black', ibjjf.id],
      ['weight', '-76 kg', ibjjf.id],
      ['gi_mode', 'gi', null],
    ]);
    const b = await categorySet('adcc-77', [
      ['weight', '-77 kg', adcc.id],
      ['gi_mode', 'no-gi', null],
    ]);
    const values = await h.db.select().from(T.categoryValues).where(sql`${T.categoryValues.originalLabel} in ('-76 kg', '-77 kg')`);
    await repo.insert(
      T.categoryMappings,
      {
        fromValueId: values[0]!.id,
        toValueId: values[1]!.id,
        relationId: d(DomainKind.CategoryRelation, 'approximately'),
        contextOrganizationId: adcc.id,
      } as never,
      actor,
    );
    const bout = await extension('bout.v1');
    const comp = await competition('adcc', 'jiu-jitsu', 'adcc');
    const ev = await event((await edition(comp.id, 2019)).id, 'jiu-jitsu', 'Men · -77 kg', 'knockout', 'individual', b);
    const fighter = await person('fighter');
    const en = await entry(ev.editionId, ev.id, fighter.id);
    await result('event', ev.id, en.id, 1, 'won', { schemaId: bout.id, data: { method: 'submission', round: 1 } });
    expect(a).not.toBe(b);
  });

  it('5 · Ironman: circuit, stage (leg), age-group category, time, a DNF', async () => {
    const im = await competition('ironman-world-championship', 'triathlon', 'ironman');
    const ed = await edition(im.id, 2025, 'season', '2025 season');
    const leg = await repo.insert(T.competitionStages, { editionId: ed.id, stageKindId: d(DomainKind.StageKind, 'leg'), label: 'Kona' } as never, actor);
    const ev = await event(
      ed.id,
      'triathlon',
      'Women 30–34',
      'race_measured',
      'individual',
      await categorySet('ironman-f30-34', [
        ['age', '30–34', null],
        ['sex_category', 'women', null],
        ['distance', 'Ironman (226 km)', null],
      ]),
    );
    const [a, b] = await Promise.all([person('finisher'), person('dnf')]);
    const r1 = await result('event', ev.id, (await entry(ed.id, ev.id, a.id)).id, 1, 'finished');
    await measure(r1.id, 'time', 'duration', 's', 'lower', 30612, '8:30:12');
    await result('event', ev.id, (await entry(ed.id, ev.id, b.id)).id, null, 'dnf');
    const standings = await repo.insert(
      T.classifications,
      { editionId: ed.id, stageId: leg.id, kindId: d(DomainKind.ClassificationKind, 'circuit_standings'), label: 'Pro series points' } as never,
      actor,
    );
    expect(standings.id).toBeTruthy();
  });

  it('6 · chess world championship: rounds, games, colour + rating via extension, title, rapid variant', async () => {
    const wcc = await competition('world-chess-championship', 'chess', 'fide');
    const ed = await edition(wcc.id, 2013);
    const ev = await event(ed.id, 'chess', 'Match', 'match_series', 'individual', await categorySet('chess-classical', [['time_control', 'classical', null]]));
    const [carlsen, anand] = await Promise.all([person('carlsen'), person('anand')]);
    const [ec, ea] = [await entry(ed.id, ev.id, carlsen.id), await entry(ed.id, ev.id, anand.id)];
    const game = await repo.insert(T.contests, { eventId: ev.id, label: 'Game 5', sequence: 5 } as never, actor);
    await repo.insert(T.contestSides, { contestId: game.id, entryId: ec.id, side: 1, outcomeId: d(DomainKind.ContestOutcome, 'win') } as never, actor);
    await repo.insert(T.contestSides, { contestId: game.id, entryId: ea.id, side: 2, outcomeId: d(DomainKind.ContestOutcome, 'loss') } as never, actor);
    const g = await extension('chess-game.v1');
    await result('contest', game.id, ec.id, 1, 'won', { schemaId: g.id, data: { colour: 'white', eco: 'C67', ratingWhite: 2870, ratingBlack: 2775 } });
    const res = await result('event', ev.id, ec.id, 1, 'won');
    await measure(res.id, 'match_score', 'points', 'pts', 'higher', 6.5, '6½–3½');
    await grant((await definition('world-chess-champion', 'championship_title', wcc.id)).id, carlsen.id, { resultId: res.id, year: 2013 });
  });

  it('7 · esports (Worlds): game version dimension, org team, roster with a substitution, maps as contests, season', async () => {
    const worlds = await competition('worlds-lol', 'league-of-legends', 'riot-games');
    const ed = await edition(worlds.id, 2024, 'season', 'Season 14');
    const ev = await event(
      ed.id,
      'league-of-legends',
      'Main event',
      'group_and_knockout',
      'team',
      await categorySet('lol-14-19', [['game_version', 'Patch 14.19', null]]),
    );
    const t1 = await repo.insert(T.teams, { slug: 't1', name: 'T1', kind: 'esports_org' } as never, actor);
    const en = await entry(ed.id, ev.id, t1.id);
    const [faker, sub] = await Promise.all([person('faker'), person('sub-player')]);
    await repo.insert(
      T.entryMembers,
      {
        entryId: en.id,
        personId: faker.id,
        roleId: d(DomainKind.ParticipationRole, 'starter'),
        registrationStatusId: d(DomainKind.EntryStatus, 'registered'),
        appearanceId: d(DomainKind.Appearance, 'appeared'),
      } as never,
      actor,
    );
    await repo.insert(
      T.entryMembers,
      {
        entryId: en.id,
        personId: sub.id,
        roleId: d(DomainKind.ParticipationRole, 'substitute'),
        registrationStatusId: d(DomainKind.EntryStatus, 'replacement'),
        appearanceId: d(DomainKind.Appearance, 'did_not_appear'),
      } as never,
      actor,
    );
    await repo.insert(T.contests, { eventId: ev.id, label: 'Final · map 5', sequence: 5 } as never, actor);
    await repo.insert(
      T.competitorMemberships,
      { memberId: faker.id, parentId: t1.id, roleId: d(DomainKind.MembershipRole, 'player'), fromYear: 2013 } as never,
      actor,
    );
  });

  it('8 · indigenous sport: original name + self-designation, community as representation and authority, traditional honour without rank', async () => {
    const tora = await sport('corrida-de-tora');
    const kind = await repo.insert(T.domainValues, { domain: 'community_kind', slug: 'test-people', sortOrder: 0 } as never, actor);
    const people = await repo.insert(T.communities, { slug: 'xavante', kindId: kind.id } as never, actor);
    await repo.insert(
      T.entityAliases,
      { entityId: people.id, name: 'A’uwẽ Uptabi', normalized: 'auwe uptabi', kindId: d(DomainKind.NameKind, 'self_designation'), locale: 'xav' } as never,
      actor,
    );
    await repo.insert(
      T.entityAliases,
      { entityId: tora.id, name: 'Uiwede', normalized: 'uiwede', kindId: d(DomainKind.NameKind, 'original'), locale: 'xav' } as never,
      actor,
    );
    const council = await org('community-council');
    await repo.insert(
      T.organizationRoles,
      { organizationId: council.id, targetId: tora.id, roleId: d(DomainKind.OrganizationRole, 'community_authority') } as never,
      actor,
    );
    const games = await competition('jogos-dos-povos-indigenas', null, 'community-council');
    const ed = await edition(games.id, null, 'single_event', 'Village games');
    const ev = await event(ed.id, 'corrida-de-tora', 'Log race', 'traditional', 'team');
    const team = await repo.insert(
      T.competitorGroups,
      { slug: 'village-team', name: 'Village team', groupKindId: d(DomainKind.GroupKind, 'roster') } as never,
      actor,
    );
    const en = await entry(ed.id, ev.id, team.id, people.id);
    const r = await result('event', ev.id, en.id, null, 'recognized');
    await grant((await definition('traditional-honour-log-race', 'traditional_honor', games.id, council.id)).id, team.id, { resultId: r.id });
    const reps = await h.db.select().from(T.competitionEntries).where(eq(T.competitionEntries.representationId, people.id));
    expect(reps).toHaveLength(1);
  });

  it('9 · beach volleyball pair: an entry made of two people; pairs change between seasons', async () => {
    const [a, b, c] = await Promise.all([person('pair-a'), person('pair-b'), person('pair-c')]);
    const p1 = await repo.insert(
      T.competitorGroups,
      { slug: 'a-b', name: 'A / B', groupKindId: d(DomainKind.GroupKind, 'pair'), validFrom: '2020-01-01', validTo: '2022-12-31' } as never,
      actor,
    );
    const p2 = await repo.insert(
      T.competitorGroups,
      { slug: 'a-c', name: 'A / C', groupKindId: d(DomainKind.GroupKind, 'pair'), validFrom: '2023-01-01' } as never,
      actor,
    );
    for (const [g, ms] of [
      [p1, [a, b]],
      [p2, [a, c]],
    ] as const)
      for (const m of ms)
        await repo.insert(T.competitorMemberships, { memberId: m.id, parentId: g.id, roleId: d(DomainKind.MembershipRole, 'member') } as never, actor);
    expect((await h.db.select().from(T.competitorMemberships).where(eq(T.competitorMemberships.memberId, a.id))).length).toBe(2);
  });

  it('10 · long jump record: mark, unit, wind condition, ratification and supersession', async () => {
    const wa = await org('world-athletics');
    const m = await metric('distance', 'distance', 'm', 'higher');
    const def = await definition('world-record-long-jump-men', 'record', null, wa.id, m.id);
    const [beamon, powell] = await Promise.all([person('beamon'), person('powell')]);
    const old = await repo.insert(
      T.recordMarks,
      {
        definitionId: def.id,
        competitorId: beamon.id,
        valueNumeric: 8.9,
        valueOriginal: '8.90 m',
        unitOriginal: 'm',
        date: '1968-10-18',
        conditions: 'wind +2.0 m/s',
        ratificationStatusId: d(DomainKind.RatificationStatus, 'superseded'),
        ratifiedByOrgId: wa.id,
      } as never,
      actor,
    );
    const current = await repo.insert(
      T.recordMarks,
      {
        definitionId: def.id,
        competitorId: powell.id,
        valueNumeric: 8.95,
        valueOriginal: '8.95 m',
        unitOriginal: 'm',
        date: '1991-08-30',
        conditions: 'wind +0.3 m/s',
        ratificationStatusId: d(DomainKind.RatificationStatus, 'ratified'),
        ratifiedByOrgId: wa.id,
      } as never,
      actor,
    );
    await h.db.update(T.recordMarks).set({ supersededById: current.id }).where(eq(T.recordMarks.id, old.id));
  });

  it('11 · individual award outside any competition (Ballon d’Or), yearly cycle, issuer', async () => {
    const ff = await org('france-football');
    const def = await definition('ballon-dor', 'award', null, ff.id);
    const cycle = await repo.insert(T.recognitionCycles, { definitionId: def.id, year: 2023, label: '2023' } as never, actor);
    await grant(def.id, (await person('messi')).id, { cycleId: cycle.id, year: 2023 });
  });

  it('12 · belt held over time: holding, defenses linked to bouts, vacated and stripped', async () => {
    const ufc = await competition('ufc-middleweight-title', 'mma', 'ufc');
    const ed = await edition(ufc.id, 2006);
    const ev = await event(ed.id, 'mma', 'Middleweight', 'head_to_head', 'individual');
    const def = await definition('ufc-middleweight-belt', 'belt_title', ufc.id);
    const champ = await person('silva');
    const bout = await repo.insert(T.contests, { eventId: ev.id, label: 'UFC 64', sequence: 1 } as never, actor);
    const holding = await repo.insert(
      T.titleHoldings,
      {
        definitionId: def.id,
        competitorId: champ.id,
        wonContestId: bout.id,
        fromDate: '2006-10-14',
        toDate: '2013-07-06',
        endReasonId: d(DomainKind.TitleEndReason, 'lost'),
        defenses: 10,
      } as never,
      actor,
    );
    await repo.insert(
      T.titleDefenses,
      { holdingId: holding.id, contestId: (await repo.insert(T.contests, { eventId: ev.id, label: 'UFC 67', sequence: 2 } as never, actor)).id } as never,
      actor,
    );
    await repo.insert(
      T.titleHoldings,
      {
        definitionId: def.id,
        competitorId: (await person('vacated')).id,
        fromDate: '2014-01-01',
        toDate: '2015-01-01',
        endReasonId: d(DomainKind.TitleEndReason, 'vacated'),
      } as never,
      actor,
    );
    await repo.insert(
      T.titleHoldings,
      {
        definitionId: def.id,
        competitorId: (await person('stripped')).id,
        fromDate: '2016-01-01',
        toDate: '2016-06-01',
        endReasonId: d(DomainKind.TitleEndReason, 'stripped'),
      } as never,
      actor,
    );
  });

  it('13 · Paralympic swimming S9: adaptive sport class as a category dimension', async () => {
    const set = await categorySet('para-swimming-s9', [
      ['sport_class', 'S9', null],
      ['distance', '100 m', null],
    ]);
    const pg = await competition('paralympic-games-summer', null, 'ipc');
    const ev = await event((await edition(pg.id, 2024)).id, 'swimming', '100 m freestyle S9', 'race_measured', 'individual', set);
    expect(ev.categorySetId).toBe(set);
  });

  it('14 · USSR and West Germany: historical entities kept, successor only as a relation', async () => {
    const ussr = await repo.insert(T.countries, { code: 'urs', kind: 'historical', iocCode: 'URS', validFromYear: 1922, validToYear: 1991 } as never, actor);
    const russia = await repo.insert(T.countries, { iso2: 'RU', code: 'ru', kind: 'sovereign', flagEmoji: '🇷🇺' } as never, actor);
    await repo.insert(
      T.entityRelations,
      { fromId: russia.id, toId: ussr.id, relationId: d(DomainKind.EntityRelation, 'succeeded_in_sport_by') } as never,
      actor,
    );
    const yashin = await person('yashin');
    await repo.insert(
      T.competitorRepresentations,
      { competitorId: yashin.id, representationId: ussr.id, contextId: d(DomainKind.RepresentationContext, 'sporting_representation') } as never,
      actor,
    );
    await expect(repo.insert(T.countries, { code: 'bad', kind: 'sovereign' } as never, actor)).rejects.toThrow(); // CHECK: a sovereign state needs ISO 3166
    const [rep] = await h.db
      .select()
      .from(T.competitorRepresentations)
      .where(and(eq(T.competitorRepresentations.competitorId, yashin.id)));
    expect(rep?.representationId).toBe(ussr.id);
  });
});
