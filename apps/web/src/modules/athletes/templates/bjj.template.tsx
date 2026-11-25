import { BjjDivisions } from '../bjj/bjj-divisions.component';
import { ProfileShell } from './profile-shell.component';
import type { ProfileTemplateProps } from './profile-template-props.interface';

/** BJJ: belt, gi/no-gi, weight, absolute and placement classes first (explained for newcomers), then panel and rankings. */
export function BjjTemplate({ athlete, slug }: ProfileTemplateProps) {
  return <ProfileShell athlete={athlete} slug={slug} lead={<BjjDivisions profile={athlete} />} />;
}
