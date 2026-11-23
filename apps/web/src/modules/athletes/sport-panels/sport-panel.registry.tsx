import type { AthleteProfile } from '@was/shared';
import { BOXING_PANEL } from './boxing-panel.const';
import { CS_PANEL } from './cs-panel.const';
import { FOOTBALL_PANEL } from './football-panel.const';
import { GENERIC_PANEL } from './generic-panel.const';
import type { ResolvedSportPanel } from './resolved-sport-panel.interface';
import type { SportPanelDef } from './sport-panel.type';
import { SWIMMING_PANEL } from './swimming-panel.const';

const bind = <S,>(def: SportPanelDef<S>, profile: AthleteProfile): ResolvedSportPanel | null => {
  const parsed = def.schema.safeParse(profile.stats);
  if (!parsed.success) return null;
  const { Panel } = def;
  return { kpis: def.kpis(profile, parsed.data), compare: def.compare(profile, parsed.data), panel: <Panel profile={profile} stats={parsed.data} /> };
};

/** Panels with their own layout (prototype athlete.sport-panels.js); anything else uses the generic panel. */
const SPECIFIC = [FOOTBALL_PANEL, SWIMMING_PANEL, BOXING_PANEL, CS_PANEL] as const;

/** Picks the panel whose stats schema matches (football, swimming, boxing, cs) or the generic one. */
export const resolveSportPanel = (profile: AthleteProfile): ResolvedSportPanel => {
  for (const def of SPECIFIC) {
    const r = bind<unknown>(def as SportPanelDef<unknown>, profile);
    if (r) return r;
  }
  return bind(GENERIC_PANEL, profile) ?? { kpis: [], compare: [], panel: null };
};
