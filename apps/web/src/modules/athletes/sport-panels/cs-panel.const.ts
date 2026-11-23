import { type CsStats, CsStatsSchema, competitionWins } from '@was/shared';
import { currentText } from '@/i18n/text-for.helper';
import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { CsPanel } from './cs-panel.component';
import { MAJOR } from './sport-panel.const';
import { kpi, metric } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

const best = (s: CsStats) => s.hltv_top20.reduce<CsStats['hltv_top20'][number] | null>((b, h) => (!b || h.rank < b.rank ? h : b), null);

export const CS_PANEL: SportPanelDef<CsStats> = {
  schema: CsStatsSchema,
  kpis: (p, s) => {
    const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
    const majors = competitionWins(p.achievements, MAJOR);
    const top = best(s);
    const firstTeam = p.teams.reduce<number | null>((min, t) => (t.from !== null && (min === null || t.from < min) ? t.from : min), null);
    return [
      kpi(T.majors, majors.length, majors.map((m) => m.edition.label ?? m.year).join(' · '), true),
      kpi(T.titles, p.titles, T.eliteTitlesHint),
      kpi(T.bestHltv, top ? `#${top.rank}` : currentText(ATHLETE_PROFILE_MESSAGES).dash, top ? T.inYear(top.year) : undefined, true),
      kpi(T.teams, p.teams.length, firstTeam !== null ? T.teamsSince(firstTeam) : undefined),
    ];
  },
  compare: (p, s) => {
    const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
    return [
      metric(T.majors, competitionWins(p.achievements, MAJOR).length),
      metric(T.titles, p.titles),
      metric(T.bestHltvRank, best(s)?.rank, false),
      metric(T.teams, p.teams.length, null),
    ];
  },
  Panel: CsPanel,
};
