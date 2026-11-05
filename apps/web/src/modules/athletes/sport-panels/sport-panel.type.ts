import type { AthleteProfile } from '@was/shared';
import type { ComponentType } from 'react';
import type { z } from 'zod';

/** One KPI of the profile header (gold = achievement highlight). */
export interface SportKpi {
  label: string;
  value: string | number;
  hint?: string;
  gold?: boolean;
}

/** Same-sport comparison metric: `higherIsBetter` null = not ranked. */
export interface CompareMetric {
  label: string;
  value: string | number | null;
  higherIsBetter: boolean | null;
}

/** Sport-specific profile panel (doc 09 P2), chosen by `sport.statsSchema` when the stats match its schema. */
export interface SportPanelDef<S> {
  schema: z.ZodType<S>;
  kpis: (profile: AthleteProfile, stats: S) => SportKpi[];
  compare: (profile: AthleteProfile, stats: S) => CompareMetric[];
  Panel: ComponentType<{ profile: AthleteProfile; stats: S }>;
}
