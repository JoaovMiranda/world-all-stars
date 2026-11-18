import { type AthleteProfile, competitionWins, type CsStats, CsStatsSchema } from '@was/shared';
import { useCallback } from 'react';

import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import type { ChartTheme } from '@/shared-ui/chart-theme.helper';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { DateLink } from '@/shared-ui/date-link.component';
import { Section } from '@/shared-ui/section.component';
import { Tag } from '@/shared-ui/tag.component';

import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { kpi, metric } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

const MAJOR = 'major-cs';
const HLTV_MAX_RANK = 20;
const best = (s: CsStats) => s.hltv_top20.reduce<CsStats['hltv_top20'][number] | null>((b, h) => (!b || h.rank < b.rank ? h : b), null);

function CsPanel({ profile, stats }: { profile: AthleteProfile; stats: CsStats }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).panels;
  const majors = competitionWins(profile.achievements, MAJOR);
  const option = useCallback(
    ({ cssVar, axis }: ChartTheme) => ({
      tooltip: { trigger: 'axis' as const, formatter: (ps: unknown) => T.hltvTooltip(Number((ps as { value: number }[])[0]?.value ?? 0)) },
      legend: { show: false },
      xAxis: { type: 'category' as const, data: stats.hltv_top20.map((h) => String(h.year)), ...axis({ splitLine: { show: false } }) },
      yAxis: { type: 'value' as const, inverse: true, min: 1, max: HLTV_MAX_RANK, name: T.position, nameTextStyle: { color: cssVar('--muted') }, ...axis() },
      series: [
        {
          type: 'bar' as const,
          barMaxWidth: 36,
          data: stats.hltv_top20.map((h) => h.rank),
          itemStyle: { color: cssVar('--accent'), borderRadius: 2 },
          label: { show: true, position: 'insideBottom' as const, formatter: '#{c}', color: cssVar('--on-accent'), fontWeight: 600 } },
      ] }),
    [stats.hltv_top20, T],
  );
  return (
    <Section title={T.csTitle} eyebrow={stats.games.join(' · ')}>
      <div className="panel-split-even panel-split">
        {stats.hltv_top20.length > 0 && (
          <ChartContainer option={option} ariaLabel={T.hltvChart} height={240} summary={stats.hltv_top20.map((h) => `${h.year}: #${h.rank}`).join(', ')} />
        )}
        <div>
          <span className="label">{T.majorsWon}</span>
          <ul>
            {majors.map((m) => (
              <li key={m.id} className="major">
                <b>{m.edition.label ?? m.competition.name}</b>
                <span className="muted">
                  {m.team}
                  {m.date && (
                    <>
                      {' · '}
                      <DateLink date={m.date} />
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <span className="label mt-3.5 block">{T.roles}</span>
          <div className="row mt-1.5">
            {stats.roles.map((r) => (
              <Tag key={r} tone="soft">
                {r}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

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
  Panel: CsPanel };
