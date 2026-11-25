import { Link } from '@tanstack/react-router';
import type { NationRef } from '@was/shared';

interface CompetitorNameProps {
  name: string;
  /** Public profile slug: the name links to the athlete page. */
  slug: string | null;
  nation?: NationRef | null;
}

/** Competitor or person name with its nation flag; links to the athlete profile when there is one. */
export function CompetitorName({ name, slug, nation }: CompetitorNameProps) {
  return (
    <>
      {nation?.flag && (
        <span role="img" aria-label={nation.name} title={nation.name}>
          {nation.flag}
        </span>
      )}
      {nation?.flag && ' '}
      {slug ? (
        <Link to="/athletes/$slug" params={{ slug }}>
          {name}
        </Link>
      ) : (
        name
      )}
    </>
  );
}
