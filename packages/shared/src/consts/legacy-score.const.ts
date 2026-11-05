import { CompetitionLevel } from '../enums/competition-level.enum';
import { Tier } from '../enums/tier.enum';

/** Weight of a title by competition level in the legacy score (doc 00). */
export const COMPETITION_LEVEL_WEIGHT = {
  [CompetitionLevel.World]: 8,
  [CompetitionLevel.Continental]: 4,
  [CompetitionLevel.National]: 2,
  [CompetitionLevel.Local]: 1,
} as const satisfies Record<CompetitionLevel, number>;

/** Automatic tier suggestion by legacy-score percentile within the sport (doc 00). Mythic is never automatic. */
export const TIER_PERCENTILE_THRESHOLD = {
  [Tier.Legendary]: 99,
  [Tier.Elite]: 90,
} as const;

/** "Changed the game" dossier: minimum evidences to propose a Mythic (doc 00). */
export const MYTHIC_MIN_EVIDENCES = 2;
