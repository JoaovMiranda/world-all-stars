import type { SuggestionContext, ValidationContext } from '@was/shared';

import type { AppDeps } from '../../http/app-context.type';
import { loadBannedWords, loadSourceRules } from './moderation.repository';

/** GET /api/validation-context: the exact inputs the server validates with, so forms warn with the same rules. */
export const getValidationContext = async (deps: AppDeps): Promise<ValidationContext> => {
  const [words, rules, view] = await Promise.all([loadBannedWords(deps.db), loadSourceRules(deps.db), deps.catalog.get()]);
  return {
    bannedWords: words,
    sources: rules,
    knownAthletes: view.rows.athletes.map((a) => ({ ...view.athleteRef(a.id), fullName: a.fullName })),
    sports: view.sportCards().map((s) => ({ slug: s.slug, name: s.name, colorToken: s.colorToken })),
  };
};

export const getSuggestionContext = async (deps: AppDeps): Promise<SuggestionContext> => {
  const ctx = await getValidationContext(deps);
  return { bannedWords: ctx.bannedWords, sources: ctx.sources, knownAthletes: ctx.knownAthletes };
};
