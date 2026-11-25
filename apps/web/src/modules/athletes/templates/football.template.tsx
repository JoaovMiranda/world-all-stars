import { SourceAttribution } from '@/shared-ui/source-attribution.component';

import { ProfileShell } from './profile-shell.component';
import type { ProfileTemplateProps } from './profile-template-props.interface';

/** Football: club/national-team panel (caps, goals, titles) followed by the competition-family rankings; Fjelstul credit. */
export function FootballTemplate({ athlete, slug }: ProfileTemplateProps) {
  return <ProfileShell athlete={athlete} slug={slug} attribution={<SourceAttribution source="fjelstul" className="mt-6" />} />;
}
