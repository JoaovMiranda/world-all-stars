import type { InteractionCounts, InteractionStateResponse } from '@was/shared';
import { type MouseEvent, useId, useState } from 'react';

import { clearStar, myInteractionsQuery, setStar, toggleHeart } from '@/data/endpoints/interactions.query';
import { useText } from '@/i18n/use-text.hook';
import { useSession } from '@/session/use-session.hook';

import { ATHLETE_INTERACTIONS_MESSAGES } from './athlete-interactions.const';
import { squash } from './vote-motion.helper';

interface AthleteInteractionsProps {
  slug: string;
  /** Public counts from the profile DTO (absent = nobody starred or hearted yet). */
  counts?: InteractionCounts | undefined;
}

const ZERO: InteractionCounts = { stars: 0, hearts: 0 };

/**
 * Star (exclusive: one per account) and heart (unlimited) buttons of a profile (D02/D03). The server-rendered HTML only
 * has the public counts; whether *I* starred or hearted comes from `myInteractionsQuery`, fetched in the browser after
 * hydration, so the cacheable anonymous HTML never carries personal state.
 */
export function AthleteInteractions({ slug, counts }: AthleteInteractionsProps) {
  const t = useText(ATHLETE_INTERACTIONS_MESSAGES);
  const hintId = useId();
  const { isSignedIn, requireLogin } = useSession();
  const mine = myInteractionsQuery.useQuery(undefined, { enabled: isSignedIn });
  // The latest mutation answer is the freshest truth for this athlete (state + counts).
  const [latest, setLatest] = useState<InteractionStateResponse | null>(null);
  const onSuccess = (state: InteractionStateResponse) => setLatest(state);
  const give = setStar.useMutation({ onSuccess });
  const takeBack = clearStar.useMutation({ onSuccess });
  const heart = toggleHeart.useMutation({ onSuccess });

  const starred = isSignedIn && (latest?.starred ?? mine.data?.star?.athlete.slug === slug);
  const hearted = isSignedIn && (latest?.hearted ?? !!mine.data?.hearts.some((h) => h.athlete.slug === slug));
  const shown = latest?.counts ?? counts ?? ZERO;
  const elsewhere = !latest && mine.data?.star && mine.data.star.athlete.slug !== slug ? mine.data.star.athlete.knownAs : null;
  const busy = give.isPending || takeBack.isPending || heart.isPending;
  const failed = give.isError || takeBack.isError || heart.isError;

  const onStar = (event: MouseEvent<HTMLButtonElement>) => {
    if (!requireLogin('interact') || busy) return;
    squash(event.currentTarget);
    (starred ? takeBack : give).mutate({ params: { slug } });
  };
  const onHeart = (event: MouseEvent<HTMLButtonElement>) => {
    if (!requireLogin('interact') || busy) return;
    squash(event.currentTarget);
    heart.mutate({ params: { slug }, body: { hearted: !hearted } });
  };

  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-2 border-0 p-0">
      <legend className="sr-only">{t.groupLabel}</legend>
      <button
        type="button"
        className="react"
        aria-pressed={starred}
        aria-busy={busy || undefined}
        aria-describedby={hintId}
        aria-label={starred ? t.unstar(shown.stars) : t.star(shown.stars)}
        onClick={onStar}
      >
        <span aria-hidden="true">{starred ? '★' : '☆'}</span> <span className="num">{shown.stars}</span>
      </button>
      <button
        type="button"
        className="react"
        aria-pressed={hearted}
        aria-busy={busy || undefined}
        aria-label={hearted ? t.unheart(shown.hearts) : t.heart(shown.hearts)}
        onClick={onHeart}
      >
        <span aria-hidden="true">{hearted ? '♥' : '♡'}</span> <span className="num">{shown.hearts}</span>
      </button>
      <span id={hintId} className="sr-only">
        {elsewhere ? t.starElsewhere(elsewhere) : t.starHint}
      </span>
      {failed && (
        <span role="status" className="text-sm">
          {t.failed}
        </span>
      )}
    </fieldset>
  );
}
