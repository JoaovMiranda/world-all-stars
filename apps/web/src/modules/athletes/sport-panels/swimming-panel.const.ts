import { type SwimmingStats, SwimmingStatsSchema } from '@was/shared';
import { currentText } from '@/i18n/text-for.helper';
import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { kpi, metric } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';
import { SwimmingPanel } from './swimming-panel.component';

const total = (m: SwimmingStats['olympic_medals']) => m.gold + m.silver + m.bronze;

export const SWIMMING_PANEL: SportPanelDef<SwimmingStats> = {
  schema: SwimmingStatsSchema,
  kpis: (_p, s) => {
    const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
    const o = s.olympic_medals;
    const g = s.olympic_games;
    return [
      kpi(T.olympicMedals, total(o), T.olympicMedalsHint(o.gold, o.silver, o.bronze), true),
      kpi(T.olympicGolds, o.gold, T.olympicGoldsHint(g.length, g[0] ?? 0, g[g.length - 1] ?? 0), true),
      kpi(T.worldChampGolds, s.world_championship_medals.gold, T.worldChampGoldsHint),
      kpi(T.worldRecords, s.world_records.total, T.worldRecordsHint(s.world_records.individual, s.world_records.relay)),
    ];
  },
  compare: (_p, s) => {
    const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
    return [
      metric(T.olympicMedals, total(s.olympic_medals)),
      metric(T.olympicGolds, s.olympic_medals.gold),
      metric(T.worldChampGolds, s.world_championship_medals.gold),
      metric(T.worldRecords, s.world_records.total),
      metric(T.olympicGames, s.olympic_games.length),
    ];
  },
  Panel: SwimmingPanel,
};
