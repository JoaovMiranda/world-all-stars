// Identity resolution (handoff v3 §7.1, D01): signals in priority order — internal id, Wikidata QID, other external
// ids, name + birth date + sport, name + sport. A NAME ALONE never merges two records. Thresholds are a calibrated
// starting point (pnpm ingest:identity-eval measures precision/recall on the labelled sample).
import { type Database, active, athleteSports, athletes, entityAliases, entityExternalIds, sports } from '@was/db';
import { normalizeForSearch } from '@was/shared';
import { eq } from 'drizzle-orm';

export const IDENTITY_THRESHOLDS = { auto: 0.98, review: 0.75 } as const;

export interface IdentityQuery {
  name: string;
  externalIds: Record<string, string>;
  sport: string | null;
  birthDate?: string | null;
}
export interface IdentityCandidate {
  entityId: string;
  confidence: number;
  signals: string[];
}
export type IdentityDecision =
  | { kind: 'match'; entityId: string; confidence: number; signals: string[] }
  | { kind: 'review'; candidates: IdentityCandidate[] }
  | { kind: 'new' };

/** Provider of the external id → weight of an exact match (stable ids weigh more than mutable titles). */
const ID_WEIGHT: Record<string, number> = { wikidata: 1, fjelstul: 0.99, wikipedia_en: 0.99, olympedia: 0.99 };

export const normalizeName = (s: string) => normalizeForSearch(s).replace(/[^a-z0-9]+/g, ' ').trim();

/** Pure scoring of one candidate (exported for the calibration test). */
export const scoreCandidate = (
  q: IdentityQuery,
  c: { externalIds: Record<string, string>; names: string[]; sports: string[]; birthDate: string | null },
): IdentityCandidate['confidence'] => {
  for (const [provider, id] of Object.entries(q.externalIds)) {
    const theirs = c.externalIds[provider];
    if (theirs === undefined) continue;
    if (normalizeName(theirs) === normalizeName(id)) return ID_WEIGHT[provider] ?? 0.95;
    // Same provider, different id: a strong NEGATIVE signal (homonyms with distinct Wikipedia pages).
    if (provider === 'wikidata' || provider === 'wikipedia_en' || provider === 'fjelstul') return 0;
  }
  const sameName = c.names.some((n) => normalizeName(n) === normalizeName(q.name));
  const sameSport = q.sport ? c.sports.includes(q.sport) : false;
  const sameBirth = !!q.birthDate && q.birthDate === c.birthDate;
  if (!sameName) {
    // Married/full names: same surname + same birth date + same sport → human review, never automatic.
    const surname = (n: string) => normalizeName(n).split(' ').pop() ?? '';
    return sameBirth && sameSport && c.names.some((n) => surname(n) === surname(q.name)) ? 0.85 : 0;
  }
  if (sameBirth && sameSport) return 0.98;
  if (sameBirth) return 0.9;
  if (sameSport) return 0.8;
  return 0.5;
};

export const decide = (candidates: IdentityCandidate[]): IdentityDecision => {
  const sorted = [...candidates].filter((c) => c.confidence > 0).sort((a, b) => b.confidence - a.confidence);
  const [best, second] = sorted;
  if (best && best.confidence >= IDENTITY_THRESHOLDS.auto && !(second && second.confidence >= IDENTITY_THRESHOLDS.auto)) return { kind: 'match', ...best };
  const reviewable = sorted.filter((c) => c.confidence >= IDENTITY_THRESHOLDS.review);
  return reviewable.length ? { kind: 'review', candidates: reviewable } : { kind: 'new' };
};

/** In-memory index of people (loaded once per run, updated as the writer creates). */
export class PersonIndex {
  private byExternal = new Map<string, string>();
  private byName = new Map<string, Set<string>>();
  private info = new Map<string, { externalIds: Record<string, string>; names: string[]; sports: string[]; birthDate: string | null }>();

  static async load(db: Database): Promise<PersonIndex> {
    const index = new PersonIndex();
    const [people, ids, aliases, links, sportRows] = await Promise.all([
      db.select().from(athletes).where(active(athletes)),
      db.select().from(entityExternalIds).where(active(entityExternalIds)),
      db.select().from(entityAliases).where(active(entityAliases)),
      db.select().from(athleteSports).where(active(athleteSports)),
      db.select().from(sports).where(active(sports)),
    ]);
    const sportSlug = new Map(sportRows.map((s) => [s.id, s.slug]));
    for (const p of people) index.add(p.id, { names: [p.knownAs, ...(p.fullName ? [p.fullName] : [])], externalIds: {}, sports: [], birthDate: p.birthDate });
    for (const x of ids) if (index.info.has(x.entityId)) index.addExternal(x.entityId, x.provider, x.externalId);
    for (const a of aliases) if (index.info.has(a.entityId)) index.addName(a.entityId, a.name);
    for (const l of links) {
      const s = sportSlug.get(l.sportId);
      if (s) index.info.get(l.athleteId)?.sports.push(s);
    }
    return index;
  }

  add(id: string, data: { names: string[]; externalIds: Record<string, string>; sports: string[]; birthDate: string | null }) {
    this.info.set(id, { ...data, names: [], externalIds: {} });
    for (const n of data.names) this.addName(id, n);
    for (const [p, v] of Object.entries(data.externalIds)) this.addExternal(id, p, v);
  }
  addName(id: string, name: string) {
    const key = normalizeName(name);
    this.info.get(id)?.names.push(name);
    (this.byName.get(key) ?? this.byName.set(key, new Set()).get(key)!).add(id);
  }
  addExternal(id: string, provider: string, value: string) {
    const info = this.info.get(id);
    if (info) info.externalIds[provider] = value;
    this.byExternal.set(`${provider}:${normalizeName(value)}`, id);
  }
  addSport(id: string, sport: string) {
    const info = this.info.get(id);
    if (info && !info.sports.includes(sport)) info.sports.push(sport);
  }

  resolve(q: IdentityQuery): IdentityDecision {
    const ids = new Set<string>();
    for (const [p, v] of Object.entries(q.externalIds)) {
      const hit = this.byExternal.get(`${p}:${normalizeName(v)}`);
      if (hit) ids.add(hit);
    }
    for (const id of this.byName.get(normalizeName(q.name)) ?? []) ids.add(id);
    const candidates = [...ids].map((entityId) => {
      const info = this.info.get(entityId)!;
      return { entityId, confidence: scoreCandidate(q, info), signals: Object.keys(q.externalIds).filter((p) => info.externalIds[p]) };
    });
    return decide(candidates);
  }
}

export const sportIdBySlug = async (db: Database, slug: string) => (await db.select().from(sports).where(active(sports, eq(sports.slug, slug))))[0]?.id ?? null;
