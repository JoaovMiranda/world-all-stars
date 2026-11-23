import { DEFAULT_LOCALE, type Locale, type SuggestionContext, type ValidationContext } from '@was/shared';

import { BaseService } from '../../core/base.service';
import { ModerationRepository } from './moderation.repository';

/** The exact inputs the server validates with (banned words, source rules, known athletes, sports). */
export class ValidationContextService extends BaseService {
  /** GET /api/validation-context: the same inputs as the server, so forms warn with the same rules. */
  async getValidationContext(locale: Locale = this.ctx.locale): Promise<ValidationContext> {
    const moderation = new ModerationRepository(this.db);
    const [words, rules, view] = await Promise.all([moderation.loadBannedWords(), moderation.loadSourceRules(), this.ctx.deps.catalog.get(locale)]);
    return {
      bannedWords: words,
      sources: rules,
      knownAthletes: view.rows.athletes.map((a) => ({ ...view.athleteRef(a.id), fullName: a.fullName })),
      sports: view.sportCards().map((s) => ({ slug: s.slug, name: s.name, colorToken: s.colorToken })),
    };
  }

  /** Inputs of validateSuggestion. Built from the default-locale catalog whatever the request language (as before). */
  async getSuggestionContext(): Promise<SuggestionContext> {
    const ctx = await this.getValidationContext(DEFAULT_LOCALE);
    return { bannedWords: ctx.bannedWords, sources: ctx.sources, knownAthletes: ctx.knownAthletes };
  }
}
