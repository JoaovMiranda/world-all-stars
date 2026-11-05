#!/usr/bin/env node
// Exports the HTML prototype's simulated database as JSON fixtures for apps/web (?fixture=sample), one file per
// endpoint, and validates EVERY file against the shared Zod contracts (@was/shared). Fails loudly on mismatch.
//   pnpm fixtures:export
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { demoPrivacyRequests, mapAdminDossiers, mapAdminIngestion, mapAdminProposals, mapAdminUsers } from './admin-fixture-mappers.mjs';
import { mapGlobe, mapProposals, mapRun, toContract } from './fixture-mappers.mjs';
import { loadPrototype } from './prototype-loader.mjs';
import { loadShared } from './shared-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MOCK_DIR = path.join(ROOT, 'plan/front-prototype/mock');
const OUT_DIR = path.join(ROOT, 'apps/web/src/fixtures/sample');
const CALENDAR_RANGE = ['2025-01-01', '2027-12-31'];

const S = await loadShared(pathToFileURL(path.join(ROOT, 'packages/shared/src/index.ts')).href);
const { z } = await import(pathToFileURL(createRequire(path.join(ROOT, 'packages/shared/package.json')).resolve('zod')).href);
const countries = createRequire(path.join(ROOT, 'apps/web/package.json'))('i18n-iso-countries');
const { api: A, db, collectionRuns } = loadPrototype(MOCK_DIR);

// ── Demo activity of the test reader (exercises the prototype API, so `me` and notifications have data) ──
const READER = 'voce@exemplo.invalid';
const ADMIN = 'admin@exemplo.invalid';
const mine = A.postComment(READER, 'pele', 'Vi o milésimo gol num documentário. Que dia para o futebol!', null, '2026-10-20T18:00:00.000Z');
A.postComment('leitor09@exemplo.invalid', 'pele', 'Foi em 1969, no Maracanã, de pênalti.', mine.id, '2026-10-21T09:30:00.000Z');
A.submitSuggestion({ athleteName: 'Éder Jofre', sport: 'boxe', urls: ['https://en.wikipedia.org/wiki/%C3%89der_Jofre'], why: 'Campeão mundial em duas categorias.' });
A.submitSuggestion({ athleteName: 'Marta', sport: 'futebol', urls: ['https://boxrec.com/x', 'https://www.wikidata.org/wiki/Q221'], why: '' });
A.submitContact({ name: 'Ana Repórter', email: 'ana@exemplo.invalid', topic: 'press', body: 'Gostaria de entrevistar a curadoria sobre os critérios do Hall of Greats.' });
A.submitContact({ name: 'Bruno', email: 'bruno@exemplo.invalid', topic: 'data_error', body: 'A altura do atleta está diferente da Wikipedia: https://en.wikipedia.org/wiki/Exemplo' });

// ── Build every payload ──
const summaries = toContract(A.athletes());
const slugs = summaries.map((a) => a.slug);
const profiles = Object.fromEntries(slugs.map((slug) => [slug, toContract(A.athleteProfile(slug))]));
const sportsTree = toContract(A.sportsTree());
const sportCards = sportsTree.flatMap((g) => g.subgroups.flatMap((s) => s.sports));
const sportsByName = new Map(sportCards.map((s) => [s.name, s]));
const sourceOf = (linkId) => {
  const l = db.get('source_links', linkId);
  if (!l) return null;
  const s = db.get('sources', l.source_id);
  return { slug: s.slug, name: s.name, license: s.license, url: l.url, home: s.base_url };
};
const allMonthDays = [...new Set(db.all('calendar_days').map((c) => `${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`))];
const onThisDay = Object.fromEntries(
  allMonthDays.map((md) => [md, toContract(A.onThisDay(md))]).filter(([, v]) => v.items.length > 0 || v.observance),
);
const commentRows = db.all('comments');
const userName = (id) => db.get('users', id)?.display_name ?? 'Usuário removido';
const athleteRef = (id) => { const a = db.get('athletes', id); return { slug: a.slug, knownAs: a.known_as, tier: db.get('champion_tiers', a.champion_tier_id).slug }; };

const files = {
  'athletes.json': [S.AthleteListResponseSchema, { items: summaries, total: summaries.length }],
  'athlete-names.json': [z.record(z.string(), z.array(z.string())), Object.fromEntries(slugs.map((s) => {
    const p = profiles[s]; return [s, [p.knownAs, p.fullName, ...p.nicknames].filter(Boolean)];
  }))],
  'athlete-profiles.json': [z.record(z.string(), S.AthleteProfileSchema), profiles],
  'analysis-dimensions.json': [S.AnalysisDimensionsResponseSchema, A.analysisDims()],
  'sports.json': [S.SportsTreeResponseSchema, sportsTree],
  'sport-pages.json': [z.record(z.string(), S.SportPageSchema), Object.fromEntries(sportCards.map((s) => [s.slug, toContract(A.sportPage(s.slug))]))],
  'governance-models.json': [S.GovernanceModelsResponseSchema, toContract(A.governanceModels())],
  'organizations.json': [z.array(S.OrgTreeNodeSchema), toContract(A.orgTree())],
  'hall-of-greats.json': [S.HallOfGreatsResponseSchema, { greats: toContract(A.hallOfGreats()), candidates: toContract(A.candidates()) }],
  'sources.json': [S.SourcesResponseSchema, A.sourcesOverview().map((s) => ({ ...s, lastRun: s.lastRun ? mapRun(s.lastRun) : null }))],
  'collection-runs.json': [S.CollectionRunsResponseSchema, collectionRuns.map((r) => ({ startedAt: r.started_at, mode: r.mode, checked: r.checked, unchanged: r.unchanged,
    validated: r.validated, factsAccepted: r.facts_ok, factsRejected: r.facts_rejected, extractorTokens: r.extractor_tokens }))],
  'calendar.json': [S.CalendarResponseSchema, toContract(A.calendarRange(...CALENDAR_RANGE))],
  'on-this-day.json': [z.record(S.MonthDaySchema, S.OnThisDayResponseSchema), onThisDay],
  'globe.json': [z.array(S.GlobeCountrySchema), mapGlobe(A.globe(), sportsByName, (iso2) => countries.alpha2ToNumeric(iso2))],
  'tier-votes.json': [z.record(z.string(), S.TierVotesResponseSchema), Object.fromEntries(slugs.map((s) => [s, { ...A.tierVotes(s), myVote: null }]))],
  'comments.json': [z.record(z.string(), S.CommentsResponseSchema), Object.fromEntries(slugs.map((s) => [s, { ...A.comments(s, null, 'top'), nextCursor: null }]))],
  'session-users.json': [z.object({ reader: S.SessionUserSchema, admin: S.SessionUserSchema }), { reader: A.userInfo(READER), admin: A.userInfo(ADMIN) }],
  'validation-context.json': [S.ValidationContextSchema, {
    bannedWords: db.all('banned_words').map((b) => ({ term: b.term, matchMode: b.match_mode, locale: b.locale })),
    sources: db.all('sources').map((s) => ({ name: s.name, baseUrl: s.base_url, usageStatus: s.usage_status })),
    knownAthletes: db.all('athletes').map((a) => ({ ...athleteRef(a.id), fullName: a.full_name ?? null })),
    sports: sportCards.map((s) => ({ slug: s.slug, name: s.name, colorToken: s.colorToken })),
  }],
  'admin-proposals.json': [S.CrawlerProposalsResponseSchema, mapAdminProposals(db, sourceOf, mapProposals(db, sourceOf).items)],
  'admin-ingestion.json': [S.AdminIngestionResponseSchema, mapAdminIngestion(db, MOCK_DIR)],
  'admin-comments.json': [S.AdminCommentsResponseSchema, {
    items: commentRows.map((c) => ({ id: c.id, athlete: athleteRef(c.athlete_id), author: userName(c.user_id), body: c.body, at: c.created_at,
      likes: c.likes_count, dislikes: c.dislikes_count, replies: c.replies_count, status: c.status, hiddenReason: c.hidden_reason ?? null }))
      .sort((a, b) => b.dislikes - a.dislikes || b.at.localeCompare(a.at)),
    bannedWords: db.all('banned_words').map((b) => ({ term: b.term, matchMode: b.match_mode, locale: b.locale })),
  }],
  'admin-dossiers.json': [S.AdminDossiersResponseSchema, mapAdminDossiers(db, sourceOf, athleteRef, MOCK_DIR)],
  'admin-users.json': [S.AdminUsersResponseSchema, mapAdminUsers(db, A.userInfo(ADMIN).name)],
  'admin-privacy.json': [S.AdminPrivacyResponseSchema, demoPrivacyRequests(athleteRef, db)],
  'admin-inbox.json': [S.AdminInboxResponseSchema, {
    suggestions: db.all('athlete_suggestions').map((s) => ({ id: s.id, protocol: s.protocol, athleteName: s.athlete_name,
      sport: s.sport_id ? db.get('sports', s.sport_id).slug : s.sport_other, urls: s.urls, why: s.justification, email: s.contact_email, status: s.status, createdAt: s.created_at })),
    messages: db.all('contact_messages').map((m) => ({ id: m.id, protocol: m.protocol, name: m.name, email: m.email, topic: m.topic, body: m.body, status: m.status, createdAt: m.created_at })),
  }],
};

// ── Validate everything first (no partial writes), then write ──
let failures = 0;
const validated = {};
for (const [file, [schema, data]] of Object.entries(files)) {
  const result = schema.safeParse(JSON.parse(JSON.stringify(data)));
  if (!result.success) {
    failures++;
    console.error(`\n✗ ${file}`);
    for (const issue of result.error.issues.slice(0, 12)) console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    if (result.error.issues.length > 12) console.error(`   … ${result.error.issues.length - 12} more issues`);
  } else validated[file] = result.data;
}
if (failures) {
  console.error(`\n${failures} fixture(s) do not match the shared contracts. Fix the schemas or the mappers.`);
  process.exit(1);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
const count = (v) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? (Array.isArray(v.items) ? v.items.length : Object.keys(v).length) : 1);
for (const [file, data] of Object.entries(validated)) {
  fs.writeFileSync(path.join(OUT_DIR, file), `${JSON.stringify(data)}\n`);
  console.log(`✓ ${file.padEnd(26)} ${String(count(data)).padStart(4)} entries  ${(fs.statSync(path.join(OUT_DIR, file)).size / 1024).toFixed(1).padStart(7)} KB`);
}
console.log(`\n${Object.keys(validated).length} fixtures written to ${path.relative(ROOT, OUT_DIR)} (validated against @was/shared).`);
