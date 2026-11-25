import { ProfileShell } from './profile-shell.component';
import type { ProfileTemplateProps } from './profile-template-props.interface';

/** Boxing: the methodology designation (mythical · legendary · champion · contender) leads, then the fight record panel. */
export function BoxingTemplate({ athlete, slug }: ProfileTemplateProps) {
  return <ProfileShell athlete={athlete} slug={slug} rankingsFirst />;
}
