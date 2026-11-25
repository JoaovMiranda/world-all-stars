import { competitionWins, type FootballStats, FootballStatsSchema } from '@was/shared';
import { currentText } from '@/i18n/text-for.helper';
import { formatNumber } from '@/shared-ui/format.helper';
import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { FootballPanel } from './football-panel.component';
import { awardsCount, kpi, metric, percent, titleMetrics } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

const WORLD_CUP = 'fifa-world-cup';

export const FOOTBALL_PANEL: SportPanelDef<FootballStats> = {
  schema: FootballStatsSchema,
  kpis: (p, s) => {
    const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
    const cups = competitionWins(p.achievements, WORLD_CUP);
    return [
      kpi(T.titles, p.titles, T.clubsAndNational, true),
      kpi(T.worldCups, cups.length, cups.map((a) => a.year).join(' · '), true),
      s.career_goals != null
        ? kpi(T.careerGoals, formatNumber(s.career_goals), T.careerGoalsHint(formatNumber(s.career_matches ?? 0), s.career_goals_note ?? ''))
        : kpi(T.awards, awardsCount(p), T.awardsHint),
      kpi(T.nationalGoals, s.national_team.goals, T.inMatches(s.national_team.matches)),
    ];
  },
  compare: (p, s) => {
    const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
    const n = s.national_team;
    return [
      ...titleMetrics(p),
      metric(T.worldCupsWon, competitionWins(p.achievements, WORLD_CUP).length),
      metric(T.worldCupsPlayed, s.world_cups.length),
      metric(
        T.worldCupGoals,
        s.world_cups.reduce((sum, c) => sum + c.goals, 0),
      ),
      metric(T.nationalMatches, n.matches),
      metric(T.nationalGoals, n.goals),
      metric(T.goalsPerMatch, n.matches ? Number((n.goals / n.matches).toFixed(2)) : null),
      metric(T.winRate, n.wins != null ? `${percent(n.wins, n.matches)}%` : null),
      metric(T.careerGoals, s.career_goals),
      metric(T.awards, awardsCount(p)),
    ];
  },
  Panel: FootballPanel,
};
