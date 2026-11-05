import type { AthleteProfile, FieldProvenance } from '@was/shared';

import { ATHLETE_PROFILE_TEXT } from './athletes.const';

type CityRef = NonNullable<AthleteProfile['birth']['city']>;

/** Provenance of one profile field (`birth_date`, `stats.record`…). */
export const provenanceOf = (profile: AthleteProfile, field: string): FieldProvenance | undefined => profile.provenance.find((x) => x.field === field);
/** True when two sources disagree on the field (shows the "conflito" tag). */
export const hasConflict = (profile: AthleteProfile, field: string): boolean => profile.conflicts.some((c) => c.field === field);
/** Readable name of a provenance/conflict field (falls back to the raw key). */
export const fieldLabel = (field: string): string => ATHLETE_PROFILE_TEXT.fields[field] ?? field;
/** "Três Corações, Minas Gerais · 🇧🇷" */
export const formatPlace = (city: CityRef | null): string =>
  city ? `${city.name}${city.region ? `, ${city.region}` : ''}${city.country ? ` · ${city.country.flag}` : ''}` : ATHLETE_PROFILE_TEXT.dash;
/** Current year: closes careers still running in charts and overlaps. */
export const currentYear = (): number => new Date().getFullYear();
