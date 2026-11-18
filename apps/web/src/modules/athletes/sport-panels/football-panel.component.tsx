import { type AthleteProfile, competitionWins, type FootballStats, FootballStatsSchema } from '@was/shared';
import { useCallback } from 'react';

import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { barsOption, donutOption } from '@/shared-ui/chart-presets.helper';
import type { ChartTheme } from '@/shared-ui/chart-theme.helper';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { formatDate, formatNumber } from '@/shared-ui/format.helper';
import { Notice } from '@/shared-ui/notice.component';
import { Section } from '@/shared-ui/section.component';

import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { awardsCount, kpi, metric, percent, titleMetrics } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

const WORLD_CUP = 'copa-do-mundo-fifa';
type Cup = FootballStats['world_cups'][number];

function FootballPanel({ stats }: { profile: AthleteProfile; stats: FootballStats }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).panels;
  const n = stats.national_team;
  const cups = stats.world_cups;
  const hasWdl = n.wins != null && n.draws != null && n.losses != null;
  const wdl = useCallback(
    (theme: ChartTheme) =>
      donutOption(
        theme,
        [
          { name: T.wdl.wins, value: n.wins ?? 0, color: '--success' },
          { name: T.wdl.draws, value: n.draws ?? 0, color: '--info' },
          { name: T.wdl.losses, value: n.losses ?? 0, color: '--danger' },
        ],
        T.wdl.center(n.matches),
      ),
    [n, T],
  );
  const cupBars = useCallback(
    (theme: ChartTheme) =>
      barsOption(
        theme,
        cups.map((c) => c.year),
        [
          { name: T.matches, data: cups.map((c) => c.matches), color: '--land' },
          { name: T.goals, data: cups.map((c) => c.goals), color: '--primary' },
        ],
      ),
    [cups, T],
  );
  return (
    <Section title={T.nationalTitle} eyebrow={T.nationalLabel(n.matches, n.goals)}>
      <div className="panel-split">
        {hasWdl ? (
          <ChartContainer option={wdl} ariaLabel={T.wdl.aria} height={240} summary={`${T.wdl.wins}: ${n.wins} · ${T.wdl.draws}: ${n.draws} · ${T.wdl.losses}: ${n.losses}`} />
        ) : (
          <Notice tone="info">
            {T.wdlMissing} {n.as_of ? T.asOf(formatDate(n.as_of)) : ''}
          </Notice>
        )}
        {cups.length > 0 && <ChartContainer option={cupBars} ariaLabel={T.cupsChart} height={240} />}
      </div>
      {cups.length > 0 && (
        <div className="panel-gap">
          <DataTable<Cup>
            caption={T.cupsCaption}
            captionHidden
            rows={cups}
            rowKey={(c) => String(c.year)}
            columns={[
              { key: 'year', header: T.cup, cell: (c) => <span className="num">{c.year}</span> },
              { key: 'matches', header: T.matches, align: 'end', cell: (c) => c.matches },
              { key: 'goals', header: T.goals, align: 'end', cell: (c) => c.goals },
              {
                key: 'result',
                header: T.result,
                cell: (c) => (
                  <>
                    <span className={c.result === T.champion ? 'result-champion' : undefined}>{c.result}</span>
                    {c.note ? <span className="muted"> · {c.note}</span> : null}
                  </>
                ),
              },
            ]}
          />
        </div>
      )}
    </Section>
  );
}

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
      metric(T.worldCupGoals, s.world_cups.reduce((sum, c) => sum + c.goals, 0)),
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
