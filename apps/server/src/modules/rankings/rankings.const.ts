import type { Database } from '@was/db';
import type { RankingEvidence } from '@was/ranking';

import { bjjEvidence, footballEvidence } from './rankings-evidence.helper';

/** Evidence loader of each methodology. */
export const EVIDENCE: Record<string, (db: Database) => Promise<RankingEvidence[]>> = { 'football-champions': footballEvidence, 'bjj-career': bjjEvidence };
