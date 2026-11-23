import { z } from 'zod';

import { GOVERNANCE_MODEL_VALUES } from '../enums/governance-model.enum';
import { ORG_NATURE_VALUES } from '../enums/org-nature.enum';
import { optionalEnum, optionalText } from './url-filter.schema';

/** URL filters of /sports (doc 09 P6): search sport or association, governance model, hierarchy nature. */
export const SportsFiltersSchema = z.object({
  q: optionalText(),
  governance: optionalEnum(GOVERNANCE_MODEL_VALUES),
  nature: optionalEnum(ORG_NATURE_VALUES),
  /** Multi-sport programme slug (olympic-games-summer, world-games…). */
  programme: optionalText(),
});
