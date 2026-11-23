import { type AthleteProfile, isCompetitionAchievement, MEDAL_ACHIEVEMENT_TYPES, type SwimmingStats } from '@was/shared';
import { useCallback, useMemo } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { barsOption } from '@/shared-ui/chart-presets.helper';
import type { ChartTheme } from '@/shared-ui/chart-theme.interface';
import { DataTable } from '@/shared-ui/data-table.component';
import { Medal, type MedalMetal } from '@/shared-ui/medal.component';
import { Section } from '@/shared-ui/section.component';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';
import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';

const METAL_COLOR: Record<MedalMetal, string> = { gold: '--medal-gold', silver: '--medal-silver', bronze: '--medal-bronze' };
const isMetal = (type: string): type is MedalMetal => (MEDAL_ACHIEVEMENT_TYPES as readonly string[]).includes(type);

export function SwimmingPanel({ profile }: { profile: AthleteProfile; stats: SwimmingStats }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).panels;
  const ui = useText(UI_MESSAGES);
  const medals = useMemo(() => profile.achievements.filter(isCompetitionAchievement).filter((a) => a.isOlympic && isMetal(a.type)), [profile.achievements]);
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
      <ChartContainer option={option} ariaLabel={T.medalsChart} height={240} summary={ui.chartDataInTable} />
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
