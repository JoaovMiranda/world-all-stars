import { AchievementType, type BoxingStats, BoxingStatsSchema } from '@was/shared';
import { currentText } from '@/i18n/text-for.helper';
import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { BoxingPanel } from './boxing-panel.component';
import { kpi, metric, percent } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

export const BOXING_PANEL: SportPanelDef<BoxingStats> = {
  schema: BoxingStatsSchema,
  kpis: (p, s) => {
    const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
    const D = currentText(ATHLETE_PROFILE_MESSAGES).dash;
    const r = s.record;
    const hof = p.achievements.find((a) => a.type === AchievementType.HallOfFame);
    return [
      kpi(T.record, `${r.wins}-${r.losses}-${r.draws}`, T.recordHint(r.fights, r.no_contests), true),
      kpi(T.knockouts, r.wins_ko, T.knockoutsHint(percent(r.wins_ko, r.wins))),
      kpi(T.reigns, p.reigns.length, T.reignsHint, true),
      kpi(T.hallOfFame, hof ? String(hof.year) : D, T.hallOfFameHint),
    ];
  },
  compare: (p, s) => {
    const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
    return [
      metric(T.wins, s.record.wins),
      metric(T.knockouts, s.record.wins_ko),
      metric(T.koShare, `${percent(s.record.wins_ko, s.record.wins)}%`),
      metric(T.losses, s.record.losses, false),
      metric(T.reigns, p.reigns.length),
    ];
  },
  Panel: BoxingPanel,
};
