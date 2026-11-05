import {
  ANALYSIS_MAX_ATHLETES,
  type AnalysisDimensionsResponse,
  type AthleteProfile,
  type AthleteSummary,
  careerOverlapYears,
  COMPETITION_LEVEL_ORDER,
} from '@was/shared';
import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { analysisDimensionsQuery, athleteProfileQuery, athletesQuery } from '@/data/endpoints/athletes.query';
import type { ChartTheme } from '@/shared-ui/chart-theme.helper';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { LEVEL_LABEL } from '@/shared-ui/domain-labels.const';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { formatNumber } from '@/shared-ui/format.helper';
import { LevelTag } from '@/shared-ui/level-tag.component';
import { Notice } from '@/shared-ui/notice.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tag } from '@/shared-ui/tag.component';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { barsOption } from '@/shared-ui/chart-presets.helper';

import { bestFlags, commonCompetitions, seriesToken, sharedClubs, titlesByAge, titlesPerLevel, topLongevity } from './analysis.helper';
import { currentYear } from './athlete-profile.helper';
import { ATHLETE_PROFILE_TEXT } from './athletes.const';
import { CompareMatrix, type MatrixRow } from './compare-matrix.component';
import { ComparePicker } from './compare-picker.component';
import { resolveSportPanel } from './sport-panels/sport-panel.registry';
import { formatValue } from './sport-panels/sport-panel.helper';

const T = ATHLETE_PROFILE_TEXT.analysis;
const CS_SCHEMA = 'cs';
const NATIONAL_TEAM = 'national';
const AGE_AXIS_MIN = 15;
const LEVELS_ASC = [...COMPETITION_LEVEL_ORDER].reverse();

interface AnalysisTabProps {
  profile: AthleteProfile;
  /** Slugs in `?compare=` (already deduplicated, without the main athlete). */
  compare: readonly string[];
  onCompareChange: (slugs: string[]) => void;
}

const peak = (p: AthleteProfile): string | null => {
  const k = resolveSportPanel(p).kpis[0];
  return k ? T.peakValue(k.label, formatValue(k.value)) : null;
};
const pressure = (p: AthleteProfile): string => {
  const raw = p.stats as Record<string, unknown> | null;
  const record = (raw?.record ?? raw?.pro_record) as { wins?: number; wins_ko?: number } | undefined;
  if (record?.wins && record.wins_ko != null) return T.koPressure(Math.round((record.wins_ko / record.wins) * 100));
  return p.sport.statsSchema === CS_SCHEMA ? T.csPressure : T.matchData;
};

function Charts({ profiles }: { profiles: readonly AthleteProfile[] }) {
  const levelsOption = useCallback(
    (theme: ChartTheme) =>
      barsOption(
        theme,
        LEVELS_ASC.map((l) => LEVEL_LABEL[l]),
        profiles.map((p, i) => ({ name: p.knownAs, data: titlesPerLevel(p, LEVELS_ASC), color: seriesToken(i) })),
        { barMaxWidth: 18 },
      ),
    [profiles],
  );
  const ageOption = useCallback(
    ({ cssVar, axis }: ChartTheme) => ({
      tooltip: { trigger: 'axis' as const },
      xAxis: { type: 'value' as const, name: T.ageAxis, min: AGE_AXIS_MIN, interval: 5, nameTextStyle: { color: cssVar('--muted') }, ...axis({ splitLine: { show: false } }) },
      yAxis: { type: 'value' as const, minInterval: 1, ...axis() },
      series: profiles.map((p, i) => ({
        name: p.knownAs,
        type: 'line' as const,
        step: 'end' as const,
        symbolSize: 4,
        data: titlesByAge(p),
        itemStyle: { color: cssVar(seriesToken(i)) },
        lineStyle: { color: cssVar(seriesToken(i)), width: i ? 1.5 : 2.5 },
      })),
    }),
    [profiles],
  );
  return (
    <>
      <Section title={T.ageTitle} eyebrow={T.ageLabel}>
        <ChartContainer option={ageOption} ariaLabel={T.ageAria} height={240} summary={profiles.map((p) => `${p.knownAs}: ${titlesByAge(p).length}`).join(', ')} />
      </Section>
      <Section title={T.levelsTitle} eyebrow={T.ageLabel}>
        <ChartContainer option={levelsOption} ariaLabel={T.levelsAria} height={240} />
      </Section>
    </>
  );
}

function SameSport({ group }: { group: readonly AthleteProfile[] }) {
  const main = group[0];
  const metrics = useMemo(() => group.map((p) => resolveSportPanel(p).compare), [group]);
  if (!main || group.length < 2) return null;
  const rows: MatrixRow[] = (metrics[0] ?? []).map((m, r) => ({
    key: `${r}-${m.label}`,
    label: m.label,
    values: metrics.map((ms) => ms[r]?.value ?? null),
    higher: m.higherIsBetter,
  }));
  const others = group.slice(1);
  const born = (p: AthleteProfile) => (p.birth.date ? Number(p.birth.date.slice(0, 4)) : null);
  const common = commonCompetitions(group);
  return (
    <>
      <Section title={T.sameSportTitle} eyebrow={group.map((p, i) => T.leads(p.knownAs, rows.filter((row) => bestFlags(row.values, row.higher ?? null)[i]).length)).join(' · ')}>
        <CompareMatrix caption={T.metricsCaption} rowHeader={T.metric} athletes={group} rows={rows} />
        <div className="panel-gap">
          <DataTable<AthleteProfile>
            caption={T.sharedCaption}
            captionHidden
            rows={others}
            rowKey={(o) => o.slug}
            columns={[
              { key: 'who', header: T.relationTo(main.knownAs), cell: (o) => o.knownAs },
              {
                key: 'clubs',
                header: main.sport.statsSchema === CS_SCHEMA ? T.sharedTeams : T.sharedClubs,
                cell: (o) => {
                  const shared = sharedClubs(main, o, NATIONAL_TEAM);
                  return shared.length ? shared.join(', ') : <span className="muted">{T.none}</span>;
                },
              },
              {
                key: 'age',
                header: T.ageGap,
                cell: (o) => {
                  const a = born(main);
                  const b = born(o);
                  return a !== null && b !== null ? T.yearsValue(Math.abs(a - b)) : ATHLETE_PROFILE_TEXT.dash;
                },
              },
              {
                key: 'overlap',
                header: T.overlap,
                cell: (o) => {
                  const n = careerOverlapYears(main, o, currentYear());
                  return n ? T.yearsValue(n) : T.neverCrossed;
                },
              },
            ]}
          />
        </div>
      </Section>
      {common.length > 0 && (
        <Section title={T.commonTitle} eyebrow={T.commonLabel}>
          <CompareMatrix
            caption={T.commonCaption}
            rowHeader={ATHLETE_PROFILE_TEXT.achievements.competition}
            athletes={group}
            rows={common.map((c) => {
              const winners = c.counts.filter(Boolean).length;
              return {
                key: c.slug,
                label: (
                  <span className="row">
                    {c.name} <LevelTag level={c.level} />
                    {winners === group.length ? <Tag tone="soft">{T.everyone}</Tag> : <span className="muted">{T.someOf(winners, group.length)}</span>}
                  </span>
                ),
                values: c.counts.map((n) => n || null),
                higher: winners > 1 ? true : null,
                render: (v) => v ?? ATHLETE_PROFILE_TEXT.dash,
              };
            })}
          />
        </Section>
      )}
    </>
  );
}

function AnalysisContent({ profile, profiles, dims, total }: { profile: AthleteProfile; profiles: AthleteProfile[]; dims: AnalysisDimensionsResponse; total: number }) {
  const others = profiles.slice(1);
  const mixed = others.some((o) => o.sport.slug !== profile.sport.slug);
  const sameGroup = [profile, ...others.filter((o) => o.sport.slug === profile.sport.slug)];
  const scored = profiles.filter((p) => dims.bySlug[p.slug]);
  const radar = useCallback(
    ({ cssVar }: ChartTheme) => ({
      legend: { bottom: 0, top: 'auto', left: 'center' },
      tooltip: { trigger: 'item' as const },
      radar: {
        indicator: dims.keys.map((k) => ({ name: T.radarDims[k], max: 100 })),
        radius: '60%',
        center: ['50%', '45%'],
        axisName: { color: cssVar('--muted'), fontSize: 11 },
        splitLine: { lineStyle: { color: cssVar('--border') } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: cssVar('--border') } },
      },
      series: [
        {
          type: 'radar' as const,
          data: scored.map((p, i) => {
            const c = cssVar(seriesToken(profiles.indexOf(p)));
            return {
              name: p.knownAs,
              value: dims.keys.map((k) => dims.bySlug[p.slug]?.norm[k] ?? 0),
              lineStyle: { color: c, width: i ? 1.5 : 2.5 },
              itemStyle: { color: c },
              areaStyle: { color: c, opacity: i ? 0.06 : 0.15 },
            };
          }),
        },
      ],
    }),
    [dims, scored, profiles],
  );
  const raw = (p: AthleteProfile, k: (typeof dims.keys)[number]) => dims.bySlug[p.slug]?.raw[k] ?? null;
  const tierRow: MatrixRow = { key: 'tier', label: T.tier, values: profiles.map((p) => p.tier), higher: null, render: (_v, i) => {
    const p = profiles[i];
    return p ? <TierTag tier={p.tier} /> : null;
  } };
  const dimsRows: MatrixRow[] = [
    tierRow,
    ...(mixed ? [{ key: 'sport', label: T.sport, values: profiles.map((p) => p.sport.name), higher: null }] : []),
    ...dims.keys.map((k) => ({ key: k, label: T.dims[k], values: profiles.map((p) => raw(p, k)) })),
    { key: 'legacyRaw', label: T.legacyRaw, values: profiles.map((p) => p.legacy.total) },
  ];
  const conceptRows: MatrixRow[] = [
    { key: 'env', label: T.environment, higher: null, values: profiles.map((p) => T.envValue(T.env[p.sport.environment] ?? ATHLETE_PROFILE_TEXT.dash, T.format[p.sport.format] ?? ATHLETE_PROFILE_TEXT.dash)) },
    { key: 'dom', label: T.dominanceRow, values: profiles.map((p) => p.percentile) },
    { key: 'long', label: T.longevityRow, values: profiles.map(topLongevity), render: (v) => (v === null ? <span className="muted">{ATHLETE_PROFILE_TEXT.noData}</span> : T.yearsValue(Number(v))) },
    { key: 'peak', label: T.peakRow, higher: null, values: profiles.map(peak) },
    { key: 'pressure', label: T.pressureRow, higher: null, values: profiles.map(pressure) },
    { key: 'consistency', label: T.consistencyRow, higher: null, values: profiles.map(() => T.matchData) },
  ];

  return (
    <div className="stack">
      <Section title={others.length ? T.titleVs(profile.knownAs, others.length) : T.title(profile.knownAs)}>
        <ChartContainer option={radar} ariaLabel={T.radarAria} height={360} />
        <div className="panel-gap">
          <CompareMatrix caption={T.dimsCaption} rowHeader={T.dimension} athletes={profiles} rows={dimsRows} />
        </div>
        <div className="panel-gap">
          <Notice tone="info">
            {!others.length ? T.noteAlone(profile.knownAs, total, ANALYSIS_MAX_ATHLETES) : mixed ? T.noteMixed : T.noteSame(profile.sport.name)}
          </Notice>
        </div>
      </Section>
      <Section title={T.normalizedTitle} eyebrow={T.normalizedLabel}>
        <CompareMatrix caption={T.normalizedCaption} rowHeader={T.concept} athletes={profiles} rows={conceptRows} />
      </Section>
      <SameSport group={sameGroup} />
      <Charts profiles={profiles} />
      <Section title={T.legacyTitle} eyebrow={T.legacyTotal(formatNumber(profile.legacy.total), profile.percentile)}>
        <DataTable<AthleteProfile['legacy']['rows'][number]>
          caption={T.legacyCaption}
          captionHidden
          rows={profile.legacy.rows}
          rowKey={(r) => `${r.level}-${r.type}`}
          emptyText={T.legacyEmpty}
          columns={[
            { key: 'level', header: ATHLETE_PROFILE_TEXT.achievements.level, cell: (r) => <LevelTag level={r.level} /> },
            { key: 'type', header: T.type, cell: (r) => T.resultType[r.type] ?? r.type },
            { key: 'count', header: T.quantity, align: 'end', cell: (r) => r.count },
            { key: 'unit', header: T.weight, align: 'end', cell: (r) => r.unit },
            { key: 'points', header: T.points, align: 'end', sortValue: (r) => r.points, cell: (r) => <b>{formatNumber(r.points)}</b> },
          ]}
        />
      </Section>
    </div>
  );
}

/** Análise (docs 09/16): starts with nobody, up to 5 athletes, radar + normalized reading, same-sport metrics. */
export function AnalysisTab({ profile, compare, onCompareChange }: AnalysisTabProps) {
  const all = athletesQuery.useQuery({ query: {} });
  const dims = analysisDimensionsQuery.useQuery();
  const candidates: AthleteSummary[] = all.data?.items ?? [];
  const valid = compare.filter((s) => s !== profile.slug && (!all.data || candidates.some((a) => a.slug === s))).slice(0, ANALYSIS_MAX_ATHLETES);
  const others = useQueries({ queries: valid.map((slug) => athleteProfileQuery.queryOptions({ params: { slug } })) });
  const loaded = others.flatMap((q) => (q.data ? [q.data] : []));
  const loadedKey = loaded.map((p) => `${p.slug}@${p.version.current}`).join(',');
  // Stable identity while the same athletes are loaded (charts re-render only on real changes).
  const profiles = useMemo(() => [profile, ...loaded], [profile, loadedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const pending = others.some((q) => q.isPending) || dims.isPending;
  const mainSummary = candidates.find((a) => a.slug === profile.slug) ?? profile;

  return (
    <div className="stack">
      <ComparePicker main={mainSummary} selected={valid.map((slug) => ({ slug, knownAs: candidates.find((a) => a.slug === slug)?.knownAs ?? slug }))} candidates={candidates} onChange={onCompareChange} />
      {pending ? (
        <div aria-busy="true" aria-label={T.loadingCompare}>
          <SkeletonList rows={4} className="h-40 w-full" />
        </div>
      ) : dims.data ? (
        <AnalysisContent profile={profile} profiles={profiles} dims={dims.data} total={Object.keys(dims.data.bySlug).length} />
      ) : (
        <EmptyState compact title={ATHLETE_PROFILE_TEXT.errorTitle} mark="!" />
      )}
    </div>
  );
}
