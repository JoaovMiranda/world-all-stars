import { type AthleteProfile, isCompetitionAchievement } from '@was/shared';

import { BjjTemplate } from './bjj.template';
import { BoxingTemplate } from './boxing.template';
import { ChessTemplate } from './chess.template';
import { FallbackTemplate } from './fallback.template';
import { FootballTemplate } from './football.template';
import { IronmanTemplate } from './ironman.template';
import { OlympicTemplate } from './olympic.template';
import { OLYMPIC_TEMPLATE_SPORTS } from './profile-template.const';
import type { ProfileTemplate } from './profile-template.type';

/** Sport slug → template (sports.slug, plus the aliases the catalogs use). */
const BY_SPORT: Record<string, ProfileTemplate> = {
  football: FootballTemplate,
  'jiu-jitsu': BjjTemplate,
  bjj: BjjTemplate,
  'brazilian-jiu-jitsu': BjjTemplate,
  boxing: BoxingTemplate,
  chess: ChessTemplate,
  ironman: IronmanTemplate,
  triathlon: IronmanTemplate,
  ...Object.fromEntries(OLYMPIC_TEMPLATE_SPORTS.map((s) => [s, OlympicTemplate])),
};

/**
 * Template of a profile: by sport slug first; a sport without its own template uses the Olympic one when the athlete
 * has an Olympic medal or title, and the universal fallback otherwise.
 */
export const profileTemplateFor = (profile: AthleteProfile): ProfileTemplate =>
  BY_SPORT[profile.sport.slug] ?? (profile.achievements.some((a) => isCompetitionAchievement(a) && a.isOlympic) ? OlympicTemplate : FallbackTemplate);
