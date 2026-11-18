import { AchievementType, type AthleteProfile, type BoxingStats, BoxingStatsSchema } from '@was/shared';
import { useCallback } from 'react';

import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { donutOption } from '@/shared-ui/chart-presets.helper';
import type { ChartTheme } from '@/shared-ui/chart-theme.helper';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { formatDate } from '@/shared-ui/format.helper';
import { Section } from '@/shared-ui/section.component';

import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { kpi, metric, percent } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

function BoxingPanel({ stats }: { profile: AthleteProfile; stats: BoxingStats }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).panels;
  const D = useText(ATHLETE_PROFILE_MESSAGES).dash;
  const r = stats.record;
  const option = useCallback(
    (theme: ChartTheme) =>
      donutOption(
        theme,
        [
          { name: T.winsKo, value: r.wins_ko, color: '--success' },
          { name: T.winsDecision, value: r.wins - r.wins_ko, color: '--info' },
          { name: T.losses, value: r.losses, color: '--danger' },
          { name: T.noContest, value: r.no_contests, color: '--muted' },
        ],
        T.fightsCenter(r.fights),
      ),
    [r, T],
  );
  return (
    <Section
      title={T.recordTitle}
      eyebrow={T.recordLabel(stats.pro_debut ? formatDate(stats.pro_debut) : D, stats.last_fight ? formatDate(stats.last_fight) : D)}
    >
      <div className="panel-split">
        <ChartContainer option={option} ariaLabel={T.recordChart} height={240} summary={`${T.fightsCenter(r.fights).replace('\n', ' ')}: ${T.winsKo} ${r.wins_ko}, ${T.winsDecision} ${r.wins - r.wins_ko}, ${T.losses} ${r.losses}, ${T.noContest} ${r.no_contests}`} />
        <div>
          <FactList
            variant="split"
            items={[
              { key: 'ko', term: T.koWins, detail: r.wins_ko },
              { key: 'dec', term: T.decisionWins, detail: r.wins - r.wins_ko },
              { key: 'l', term: T.losses, detail: r.losses },
              { key: 'nc', term: T.noContest, detail: r.no_contests },
              { key: 'stance', term: T.stance, detail: stats.stance ?? D },
              { key: 'reach', term: T.reach, detail: stats.reach_cm ? T.reachValue(stats.reach_cm) : D },
            ]}
          />
          <p className="vote-foot">{T.recordNote}</p>
        </div>
      </div>
    </Section>
  );
}

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
