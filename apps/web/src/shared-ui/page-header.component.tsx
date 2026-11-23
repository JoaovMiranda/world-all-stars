import './page-header-media.css';

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  /** Small caps label above the title (e.g. "Sport", "Athlete"). */
  eyebrow?: ReactNode;
  /** Short paragraph under the title. */
  lead?: ReactNode;
  /** Badges next to the eyebrow (TierTag…). */
  badges?: ReactNode;
  /** Buttons on the right (Analisar, Comentar…). */
  actions?: ReactNode;
  /** Replaces the default <h1> (e.g. profile header with portrait). */
  children?: ReactNode;
  /** Visual on the left of the header (e.g. athlete portrait). */
  media?: ReactNode;
  /** Decorative layer behind the header (aria-hidden): tier stage light, aurora, particles. */
  decor?: ReactNode;
}

/** Editorial page header: eyebrow · h1 · lead · actions, with the 1px rule below (doc 09 "esqueleto comum"). */
export function PageHeader({ title, eyebrow, lead, badges, actions, children, media, decor }: PageHeaderProps) {
  return (
    <header className={media ? 'page-header page-header-media' : 'page-header'}>
      {decor && (
        <div className="page-header-decor" aria-hidden="true">
          {decor}
        </div>
      )}
      {/* Own wrapper so the entrance pose never fights the media's own animation/transform (shimmer, tilt). */}
      {media && <div className="page-header-media-slot">{media}</div>}
      <div className="page-header-main">
        {(eyebrow || badges) && (
          <div className="row">
            {eyebrow && <span className="label">{eyebrow}</span>}
            {badges}
          </div>
        )}
        <h1>{title}</h1>
        {lead && <p className="page-lead">{lead}</p>}
        {children}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
