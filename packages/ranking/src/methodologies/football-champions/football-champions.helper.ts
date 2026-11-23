import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { FootballConfig } from './football-config.type';

/** A winning squad membership whose registration and verification count for a credit. */
export const countable = (e: RankingEvidence, c: FootballConfig) =>
  e.kind === 'squad_membership' &&
  c.countableRegistration.includes(String(e.attributes.registration)) &&
  c.countableVerification.includes(String(e.attributes.verification));
