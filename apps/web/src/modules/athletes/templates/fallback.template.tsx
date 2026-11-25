import { ProfileShell } from './profile-shell.component';
import type { ProfileTemplateProps } from './profile-template-props.interface';

/** Universal fallback for any other sport: the panel chosen by the stats schema (or generic), then the rankings. */
export function FallbackTemplate({ athlete, slug }: ProfileTemplateProps) {
  return <ProfileShell athlete={athlete} slug={slug} />;
}
