import type { AthleteRef } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { Avatar } from '@/shared-ui/avatar.component';

/** Small avatar + name linking to the athlete profile (account lists and tables). */
export function AthleteChip({ athlete }: { athlete: AthleteRef }) {
  return (
    <Link className="account-athlete" to="/athletes/$slug" params={{ slug: athlete.slug }}>
      <Avatar name={athlete.knownAs} tier={athlete.tier} size={32} />
      <span>{athlete.knownAs}</span>
    </Link>
  );
}
