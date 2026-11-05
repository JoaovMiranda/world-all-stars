import { CompetitionLevel } from '../enums/competition-level.enum';

/** Display order of competition levels (world first). */
export const COMPETITION_LEVEL_ORDER = [
  CompetitionLevel.World,
  CompetitionLevel.Continental,
  CompetitionLevel.National,
  CompetitionLevel.Local,
] as const satisfies readonly CompetitionLevel[];
