import { type Database, active, bannedWords, sources } from '@was/db';
import type { BannedWord, SourceDomainRule } from '@was/shared';
import { asc } from 'drizzle-orm';

/** Inputs of the shared validators (validateComment, validateContact, validateSuggestion, checkSourceUrl). */
export const loadBannedWords = async (db: Database): Promise<BannedWord[]> =>
  (await db.select().from(bannedWords).where(active(bannedWords)).orderBy(asc(bannedWords.term))).map((b) => ({ term: b.term, matchMode: b.matchMode, locale: b.locale }));

export const loadSourceRules = async (db: Database): Promise<SourceDomainRule[]> =>
  (await db.select().from(sources).where(active(sources))).map((s) => ({ name: s.name, baseUrl: s.baseUrl, usageStatus: s.usageStatus }));
