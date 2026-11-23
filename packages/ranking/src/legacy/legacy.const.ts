/** Legacy levels (D11): L1 Recognized … L4 Historic; L5 Foundational only with an approved Hall dossier. */
export const LEGACY_LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;
export const LEGACY_RULESET_VERSION = 'legacy@1';

/** Minimum score of each computed level; L5 is never reachable by score alone. */
export const LEGACY_THRESHOLDS: Readonly<Record<(typeof LEGACY_LEVELS)[number], number>> = { L1: 1, L2: 20, L3: 40, L4: 60, L5: 80 };

/** Weights of the accepted honors (the ruleset, not a competitive score: legacy never touches scores or bands). */
export const LEGACY_HONOR_POINTS: Readonly<Record<string, number>> = {
  world_champion: 10,
  continental_champion: 6,
  national_champion: 3,
  award: 4,
  record: 5,
  hall_of_fame: 8,
};
