import { useNavigate, useRouter } from '@tanstack/react-router';
import { type ReactNode, useId, useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { MOTION } from '@/shared-ui/motion.const';
import { animateOnce } from '@/shared-ui/motion.helper';
import { HOME_MESSAGES } from './home.const';

interface RandomAthleteButtonProps {
  /** Slugs to draw from; undefined while loading. */
  athleteSlugs: readonly string[] | undefined;
  /** The home payload failed: keep the button unavailable without a loading message. */
  isError?: boolean;
  /** Sibling actions rendered in the same row. */
  children?: ReactNode;
}

/**
 * "Me surpreenda" (doc 09 P1): draws among all athletes without repeating the last pick. With an empty database it
 * stays focusable but aria-disabled and explains why. Future: GET /api/athletes/random.
 */
export function RandomAthleteButton({ athleteSlugs, isError = false, children }: RandomAthleteButtonProps) {
  const t = useText(HOME_MESSAGES).intro;
  const noteId = useId();
  const navigate = useNavigate();
  const router = useRouter();
  const diamond = useRef<HTMLSpanElement>(null);
  const winding = useRef(false);
  const last = useRef<string | null>(null);
  const isLoading = athleteSlugs === undefined && !isError;
  const isEmpty = athleteSlugs?.length === 0;
  const unavailable = !athleteSlugs || athleteSlugs.length === 0;

  const onClick = async () => {
    if (!athleteSlugs || unavailable || winding.current) return;
    const pool = athleteSlugs.length > 1 ? athleteSlugs.filter((s) => s !== last.current) : athleteSlugs;
    const slug = pool[Math.floor(Math.random() * pool.length)];
    if (!slug) return;
    last.current = slug;
    const target = { to: '/athletes/$slug', params: { slug } } as const;
    winding.current = true;
    // Loads the profile while the ◆ winds up, so the anticipation costs no waiting (Doherty).
    void router.preloadRoute(target).catch(() => undefined);
    // Anticipation: the ◆ leans back and sinks, then flips forward and pops (≈ 260 ms; skipped with reduced motion).
    await animateOnce(
      diamond.current,
      [
        { transform: 'rotate(0) translateY(0) scale(1)' },
        { transform: 'rotate(-25deg) translateY(2px) scale(.9)', offset: 0.35, easing: MOTION.easeAnticip },
        { transform: 'rotate(200deg) translateY(-3px) scale(1.25)', offset: 0.8 },
        { transform: 'rotate(180deg) translateY(0) scale(1)' },
      ],
      { duration: 260, easing: MOTION.easeOut },
    );
    winding.current = false;
    void navigate(target);
  };

  return (
    <>
      <div className="row home-intro-actions">
        <Button variant="primary" aria-disabled={unavailable} aria-describedby={unavailable ? noteId : undefined} onClick={onClick}>
          <span ref={diamond} className="random-diamond" aria-hidden="true">
            ◆
          </span>
          {t.random}
        </Button>
        {children}
      </div>
      <p id={noteId} className="home-intro-note" aria-live="polite">
        {isLoading ? t.randomLoading : isEmpty ? t.randomEmpty : ''}
      </p>
    </>
  );
}
