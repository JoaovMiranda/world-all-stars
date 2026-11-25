import type { AthleteProfile } from '../types/athlete-profile.type';
import type { AthleteBandResponse, AthleteLegacyResponse } from '../types/cross-sport.type';
import type { AthleteRankingsResponse } from '../types/ranking.type';

/** Readouts of one competitor that `composeHeadToHead` puts side by side (server services or web fixtures). */
export interface HeadToHeadInput {
  profile: AthleteProfile;
  band: AthleteBandResponse;
  legacy: AthleteLegacyResponse;
  rankings: AthleteRankingsResponse['items'];
}
