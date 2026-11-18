import { type AthleteProfile, isAwardAchievement } from '@was/shared';

import { currentText } from '@/i18n/text-for.helper';
import { formatNumber } from '@/shared-ui/format.helper';

import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import type { CompareMetric, SportKpi } from './sport-panel.type';

export const kpi = (label: string, value: string | number, hint?: string, gold = false): SportKpi => ({ label, value, ...(hint ? { hint } : {}), gold });
export const metric = (label: string, value: string | number | null | undefined, higherIsBetter: boolean | null = true): CompareMetric => ({
  label,
  value: value ?? null,
  higherIsBetter,
});
export const awardsCount = (p: AthleteProfile): number => p.achievements.filter(isAwardAchievement).length;
/** Number or text of a KPI/metric, formatted for the current language. */
export const formatValue = (v: string | number): string => (typeof v === 'number' ? formatNumber(v) : v);
export const percent = (part: number, whole: number): number => (whole ? Math.round((part / whole) * 100) : 0);

/** KPIs every sport shares: titles and world-level wins. */
export const titleKpis = (p: AthleteProfile): SportKpi[] => {
  const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
  return [kpi(T.titles, p.titles, T.titlesHint, true), kpi(T.worldWins, p.worldTitles, T.worldWinsHint, true)];
};
/** Metrics every sport shares in the same-sport comparison. */
export const titleMetrics = (p: AthleteProfile): CompareMetric[] => {
  const T = currentText(ATHLETE_PROFILE_MESSAGES).panels;
  return [metric(T.titles, p.titles), metric(T.worldTitles, p.worldTitles)];
};
