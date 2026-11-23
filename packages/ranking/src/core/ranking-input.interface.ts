import type { RankingCompetitor } from './ranking-competitor.interface';
import type { RankingEvidence } from './ranking-evidence.interface';

export interface RankingInput {
  competitors: RankingCompetitor[];
  evidence: RankingEvidence[];
}
