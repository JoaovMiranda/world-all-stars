import { OrgLogo } from './org-logo.component';
import { OrgName } from './org-name.component';
import type { OrgIdentity } from './org.type';

/** Compact org (cards of /sports): small logo + name linking to Wikipedia. Render inside <ul className="org-list">. */
export function OrgMini({ org }: { org: OrgIdentity }) {
  return (
    <li className="org-mini">
      <OrgLogo org={org} size={22} />
      <OrgName org={org} />
    </li>
  );
}
