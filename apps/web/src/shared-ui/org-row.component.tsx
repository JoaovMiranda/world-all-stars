import type { ReactNode } from 'react';

import { Tag } from './tag.component';
import { ORG_ROLE_LABEL } from './domain-labels.const';
import { OrgInfo } from './org-info.component';
import { OrgLogo } from './org-logo.component';
import { OrgName } from './org-name.component';
import type { OrgLike } from './org.type';
import { UI_TEXT } from './ui-text.const';
import { useDisclosure } from './use-disclosure.hook';

/** Full org line (sport page, hierarchy): logo · flag · name · ⓘ · roles · nature, with the ⓘ summary panel. */
interface OrgRowProps {
  org: OrgLike;
  /** Before the logo (e.g. relation to the parent in the hierarchy). */
  lead?: ReactNode;
  /** Extra badges after the nature (kind, level…). */
  tags?: ReactNode;
  /** Under the row (e.g. sports it governs, nested children of a tree). */
  children?: ReactNode;
  className?: string;
}

export function OrgRow({ org, lead, tags, children, className }: OrgRowProps) {
  const info = useDisclosure();
  return (
    <li className={className ?? 'org-row'}>
      <div className="node-row">
        {lead}
        <OrgLogo org={org} />
        {org.country && <span aria-hidden="true">{org.country.flag}</span>}
        <OrgName org={org} />
        <button type="button" className="info-btn" aria-label={UI_TEXT.moreInfoAbout(org.name)} {...info.buttonProps}>
          i
        </button>
        {org.roles?.map((r) => (
          <Tag key={r} tone="soft">
            {ORG_ROLE_LABEL[r] ?? r}
          </Tag>
        ))}
        <Tag className={`nat-${org.nature}`}>{org.natureLabel}</Tag>
        {tags}
      </div>
      {info.open && <OrgInfo org={org} id={info.contentId} />}
      {children}
    </li>
  );
}
