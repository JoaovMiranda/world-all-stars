import type { SportCard as SportCardData } from '@was/shared';
import { Link } from '@tanstack/react-router';
import type { CSSProperties, ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { tokenColor } from './format.helper';
import { OrgMini } from './org-mini.component';
import type { OrgIdentity } from './org.type';
import { CountUp } from './count-up.component';
import { UI_MESSAGES } from './ui-text.const';

interface SportCardProps {
  sport: SportCardData;
  /** Show the associations (logo + Wikipedia link). Default true; the home uses the compact card. */
  showAssociations?: boolean;
  /** Max associations listed. */
  maxAssociations?: number;
  /** Associations to list instead of the first `maxAssociations` (e.g. governing first, /sports). */
  associations?: readonly (OrgIdentity & { slug: string })[];
  /** Small caps label above the association list (e.g. "Associações · 14"). */
  associationsLabel?: ReactNode;
  /** Badges under the title (e.g. governance model). */
  tags?: ReactNode;
  /** Footer (links stay clickable above the stretched card link). */
  footer?: ReactNode;
}

/** Whole card clickable → /sports/$slug (stretched link); association links stay independently clickable. */
export function SportCard({ sport, showAssociations = true, maxAssociations = 4, associations, associationsLabel, tags, footer }: SportCardProps) {
  const ui = useText(UI_MESSAGES);
  const listed = associations ?? sport.associations.slice(0, maxAssociations);
  return (
    <article className="sport-card" style={{ '--c': tokenColor(sport.colorToken) } as CSSProperties}>
      <small>
        {sport.group} › {sport.subgroup}
      </small>
      <h3>
        <Link to="/sports/$slug" params={{ slug: sport.slug }}>
          {sport.name}
        </Link>
      </h3>
      {tags && <div className="row">{tags}</div>}
      <div className="count">
        <CountUp value={sport.athletes} />
      </div>
      <small>
        {ui.champions} · {ui.mythic(sport.mythic)} · {ui.competitions(sport.competitions)}
      </small>
      {showAssociations && associationsLabel && <span className="label mt-2">{associationsLabel}</span>}
      {showAssociations && listed.length > 0 && (
        <ul className="org-list">
          {listed.map((o) => (
            <OrgMini key={o.slug} org={o} />
          ))}
        </ul>
      )}
      {footer && <div className="sport-card-foot">{footer}</div>}
    </article>
  );
}
