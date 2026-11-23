import { BaseReadRepository, bannedWords, sources } from '@was/db';
import type { BannedWord, SourceDomainRule } from '@was/shared';
import { asc } from 'drizzle-orm';

/** Inputs of the shared validators (validateComment, validateContact, validateSuggestion, checkSourceUrl). */
export class ModerationRepository extends BaseReadRepository {
  async loadBannedWords(): Promise<BannedWord[]> {
    const rows = await this.db.select().from(bannedWords).where(this.active(bannedWords)).orderBy(asc(bannedWords.term));
    return rows.map((b) => ({ term: b.term, matchMode: b.matchMode, locale: b.locale }));
  }

  async loadSourceRules(): Promise<SourceDomainRule[]> {
    const rows = await this.db.select().from(sources).where(this.active(sources));
    return rows.map((s) => ({ name: s.name, baseUrl: s.baseUrl, usageStatus: s.usageStatus }));
  }
}
