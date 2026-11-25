import { OlympicMedals } from './olympic-medals.component';
import { ProfileShell } from './profile-shell.component';
import type { ProfileTemplateProps } from './profile-template-props.interface';

/** Olympic sports: the Olympic medal tally first, then the sport panel (swimming, generic…) and the rankings. */
export function OlympicTemplate({ athlete, slug }: ProfileTemplateProps) {
  return <ProfileShell athlete={athlete} slug={slug} lead={<OlympicMedals profile={athlete} />} />;
}
