import type { AthleteProfile } from '@was/shared';

/** Input of every sport profile template. */
export interface ProfileTemplateProps {
  athlete: AthleteProfile;
  /** Slug of the URL (comments query key). */
  slug: string;
}
