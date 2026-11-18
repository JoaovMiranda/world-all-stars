import { type AthleteProfile, isCompetitionAchievement, MEDAL_ACHIEVEMENT_TYPES, type SwimmingStats, SwimmingStatsSchema } from '@was/shared';
import { useCallback, useMemo } from 'react';

import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { barsOption } from '@/shared-ui/chart-presets.helper';
import type { ChartTheme } from '@/shared-ui/chart-theme.helper';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { Medal, type MedalMetal } from '@/shared-ui/medal.component';
import { Section } from '@/shared-ui/section.component';

import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { kpi, metric } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

const METAL_COLOR: Record<MedalMetal, string> = { gold: '--medal-gold', silver: '--medal-silver', bronze: '--medal-bronze' };
const isMetal = (type: string): type is MedalMetal => (MEDAL_ACHIEVEMENT_TYPES as readonly string[]).includes(type);
const total = (m: SwimmingStats['olympic_medals']) => m.gold + m.silver + m.bronze;

function SwimmingPanel({ profile }: { profile: AthleteProfile; stats: SwimmingStats }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).panels;
  const medals = useMemo(
    () => profile.achievements.filter(isCompetitionAchievement).filter((a) => a.isOlympic && isMetal(a.type)),
    [profile.achievements],
  );
  const games = useMemo(() => [...new Set(medals.map((a) => a.year))].sort((a, b) => a - b), [medals]);
  const events = useMemo(() => [...new Set(medals.map((a) => a.category ?? T.event))], [medals, T]);
  const option = useCallback(
    (theme: ChartTheme) =>
      barsOption(
        theme,
        games,
        MEDAL_ACHIEVEMENT_TYPES.map((metal) => ({
          name: T[metal],
          data: games.map((y) => medals.filter((a) => a.year === y && a.type === metal).length),
          color: METAL_COLOR[metal],
        })),
        { stack: true, barMaxWidth: 28 },
      ),
    [games, medals, T],
  );
  if (!medals.length) return null;
  return (
    <Section title={T.medalsTitle} eyebrow={T.medalsLabel}>
      <ChartContainer option={option} ariaLabel={T.medalsChart} height={240} />
      <div className="panel-gap">
        <DataTable<string>
          caption={T.medalGridCaption}
          captionHidden
          rows={events}
          rowKey={(e) => e}
          columns={[
            { key: 'event', header: T.event, cell: (e) => e },
            ...games.map((y) => ({
              key: String(y),
              header: String(y),
              cell: (e: string) => {
                const m = medals.find((a) => (a.category ?? T.event) === e && a.year === y);
                return m && isMetal(m.type) ? (
                  <span className="medal-cell">
                    <Medal metal={m.type}>{T.medalLetter[m.type]}</Medal>
                  </span>
                ) : null;
              },
            })),
          ]}
        />
      </div>
    </Section>
  );
}

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
