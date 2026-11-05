import {
  type AthleteProfile,
  type AwardAchievement,
  type CompetitionAchievement,
  COMPETITION_LEVEL_ORDER,
  type CompetitionLevel,
  competitionWins,
  isAwardAchievement,
} from '@was/shared';
import { useCallback, useMemo, useState } from 'react';

import type { ChartTheme } from '@/shared-ui/chart-theme.helper';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { ChipToggleGroup } from '@/shared-ui/chip-toggle-group.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { LEVEL_LABEL } from '@/shared-ui/domain-labels.const';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { LevelTag } from '@/shared-ui/level-tag.component';
import { Section } from '@/shared-ui/section.component';
import { SourceInfo } from '@/shared-ui/source-info.component';
import { barsOption } from '@/shared-ui/chart-presets.helper';

import { type AchievementGroup, byYear, groupByAward, groupByCompetition, yearsBetween } from './achievements.helper';
import { ATHLETE_PROFILE_TEXT, LEVEL_COLOR_TOKEN } from './athletes.const';
import { YearChips } from './year-chips.component';

const T = ATHLETE_PROFILE_TEXT.achievements;

const typeLabel = (type: string) => T.typeLabel[type] ?? type;

function TitlesTable({ groups }: { groups: readonly AchievementGroup<CompetitionAchievement>[] }) {
  return (
    <DataTable<AchievementGroup<CompetitionAchievement>>
      caption={T.titlesCaption}
      captionHidden
      rows={groups}
      rowKey={(g) => g.key}
      emptyText={T.noTitles}
      columns={[
        {
          key: 'comp',
          header: T.competition,
          sortValue: (g) => g.name,
          cell: (g) => {
            const teams = [...new Set(g.items.map((i) => i.team).filter(Boolean))].join(' · ');
            return (
              <>
                {g.name}
                <SourceInfo source={g.items[0]?.source ?? null} field={g.name} />
                {teams && <span className="cell-sub">{teams}</span>}
              </>
            );
          },
        },
        { key: 'level', header: T.level, sortValue: (g) => COMPETITION_LEVEL_ORDER.indexOf(g.level), cell: (g) => <LevelTag level={g.level} /> },
        {
          key: 'years',
          header: T.years,
          cell: (g) => (
            <YearChips
              chips={byYear(g.items).map(([y, is]) => ({
                key: String(y),
                text: `${y}${is.length > 1 ? ` ${T.times(is.length)}` : is[0]?.edition.label ? ` · ${is[0].edition.label}` : ''}`,
                title: is.map((i) => [typeLabel(i.type), i.category, i.edition.label].filter(Boolean).join(' · ')).join('; '),
              }))}
            />
          ),
        },
        { key: 'total', header: T.total, align: 'end', sortValue: (g) => g.items.length, cell: (g) => <span className="titles-count">{g.items.length}</span> },
      ]}
    />
  );
}

function AwardsTable({ groups }: { groups: readonly AchievementGroup<AwardAchievement>[] }) {
  return (
    <DataTable<AchievementGroup<AwardAchievement>>
      caption={T.awardsCaption}
      captionHidden
      rows={groups}
      rowKey={(g) => g.key}
      emptyText={T.noAwards}
      columns={[
        {
          key: 'award',
          header: T.award,
          sortValue: (g) => g.name,
          cell: (g) => (
            <>
              {g.name}
              <SourceInfo source={g.items[0]?.source ?? null} field={g.name} />
            </>
          ),
        },
        { key: 'level', header: T.level, cell: (g) => <LevelTag level={g.level} /> },
        {
          key: 'years',
          header: T.years,
          cell: (g) => (
            <YearChips
              chips={g.items.map((i) => ({
                key: i.id,
                text: `${i.year}${i.rank ? ` · ${T.rank(i.rank)}` : i.label ? ` · ${i.label}` : ''}`,
                ...(i.label ? { title: i.label } : {}),
              }))}
            />
          ),
        },
        { key: 'total', header: T.total, align: 'end', sortValue: (g) => g.items.length, cell: (g) => <span className="titles-count">{g.items.length}</span> },
      ]}
    />
  );
}

/** Conquistas: titles per year stacked by level (toggle chips), titles by competition, awards. */
export function AchievementsTab({ profile }: { profile: AthleteProfile }) {
  const wins = useMemo(() => competitionWins(profile.achievements), [profile.achievements]);
  const awards = useMemo(() => profile.achievements.filter(isAwardAchievement), [profile.achievements]);
  const levels = useMemo(() => COMPETITION_LEVEL_ORDER.filter((l) => wins.some((a) => a.level === l)), [wins]);
  const [active, setActive] = useState<CompetitionLevel[]>(levels);
  const shown = levels.filter((l) => active.includes(l));
  const years = useMemo(() => {
    const ys = wins.map((a) => a.year);
    return ys.length ? yearsBetween(Math.min(...ys, profile.careerFrom ?? Infinity), Math.max(...ys)) : [];
  }, [wins, profile.careerFrom]);
  const groups = useMemo(() => groupByCompetition(wins), [wins]);
  const awardGroups = useMemo(() => groupByAward(awards), [awards]);

  const option = useCallback(
    (theme: ChartTheme) => ({
      ...barsOption(
        theme,
        years,
        shown.map((l) => ({ name: LEVEL_LABEL[l], data: years.map((y) => wins.filter((a) => a.level === l && a.year === y).length), color: `--${LEVEL_COLOR_TOKEN[l]}` })),
        { stack: true, barMaxWidth: 18 },
      ),
      legend: { show: false },
    }),
    [years, shown, wins],
  );

  if (!profile.achievements.length) {
    return (
      <EmptyState title={T.emptyTitle} mark="◇">
        {T.emptyText}
      </EmptyState>
    );
  }

  return (
    <div className="stack">
      <Section
        title={T.chartTitle}
        actions={
          levels.length > 0 && (
            <ChipToggleGroup
              multiple
              label={T.levelsLabel}
              value={shown}
              onChange={(next) => next.length && setActive(next)}
              options={levels.map((l) => ({ value: l, label: T.levelChip(LEVEL_LABEL[l], wins.filter((a) => a.level === l).length), swatch: LEVEL_COLOR_TOKEN[l] }))}
            />
          )
        }
      >
        {years.length > 0 && <ChartContainer option={option} ariaLabel={T.chartAria} summary={T.chartSummary(wins.length, years[0] ?? 0, years[years.length - 1] ?? 0)} />}
        <div className="panel-gap">
          <TitlesTable groups={groups.filter((g) => shown.includes(g.level))} />
        </div>
      </Section>
      <Section title={T.awardsTitle}>
        <AwardsTable groups={awardGroups} />
      </Section>
    </div>
  );
}
