import { type AthleteProfile, type AthleteStats, isCompetitionAchievement } from '@was/shared';
import { useCallback, useMemo } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { barsOption } from '@/shared-ui/chart-presets.helper';
import type { ChartTheme } from '@/shared-ui/chart-theme.interface';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { Section } from '@/shared-ui/section.component';
import { ATHLETE_PROFILE_MESSAGES, GENERIC_STATS_MAX } from '../athletes.const';
import { statEntries } from './generic-panel.helper';

export function GenericPanel({ profile }: { profile: AthleteProfile; stats: AthleteStats | null }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).panels;
  const entries = useMemo(() => statEntries(profile.stats).slice(0, GENERIC_STATS_MAX), [profile.stats]);
  const byComp = useMemo(() => {
    const counts = new Map<string, number>();
    profile.achievements.filter(isCompetitionAchievement).forEach((a) => counts.set(a.competition.name, (counts.get(a.competition.name) ?? 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [profile.achievements]);
  const option = useCallback(
    (theme: ChartTheme) =>
      barsOption(
        theme,
        byComp.map(([n]) => n),
        [{ name: T.titles, data: byComp.map(([, c]) => c), color: `--${profile.sport.colorToken}` }],
        { horizontal: true, barMaxWidth: 16 },
      ),
    [byComp, profile.sport.colorToken, T],
  );
  return (
    <Section title={T.genericTitle(profile.sport.name)} eyebrow={T.genericLabel(profile.stats?.schema ?? profile.sport.statsSchema)}>
      <div className="panel-split-even panel-split">
        {entries.length ? (
          <FactList variant="split" items={entries.map((e) => ({ key: e.key, term: e.label, detail: e.text }))} />
        ) : (
          <EmptyState compact title={T.noStats} mark="◇" />
        )}
        {byComp.length ? (
          <ChartContainer
            option={option}
            ariaLabel={T.byCompetitionChart}
            height={Math.max(160, byComp.length * 34 + 40)}
            summary={byComp.map(([n, c]) => `${n}: ${c}`).join(', ')}
          />
        ) : (
          <EmptyState compact title={T.noCompetitionTitles} mark="◇" />
        )}
      </div>
    </Section>
  );
}
