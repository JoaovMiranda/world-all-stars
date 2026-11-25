import { ProfileShell } from './profile-shell.component';
import type { ProfileTemplateProps } from './profile-template-props.interface';

/** Chess: classical-methodology position (world titles, peak rating, years as #1) leads, then the stats panel. */
export function ChessTemplate({ athlete, slug }: ProfileTemplateProps) {
  return <ProfileShell athlete={athlete} slug={slug} rankingsFirst />;
}
