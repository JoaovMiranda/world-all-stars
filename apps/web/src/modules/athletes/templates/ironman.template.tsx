import { ProfileShell } from './profile-shell.component';
import type { ProfileTemplateProps } from './profile-template-props.interface';

/** Ironman: the results panel (world titles, podiums, course records) followed by the Ironman ranking. */
export function IronmanTemplate({ athlete, slug }: ProfileTemplateProps) {
  return <ProfileShell athlete={athlete} slug={slug} />;
}
