import { useNavigate } from '@tanstack/react-router';
import { type ReactNode, useId, useRef } from 'react';

import { Button } from '@/shared-ui/button.component';

import { HOME_TEXT } from './home.const';

interface RandomAthleteButtonProps {
  /** Slugs to draw from; undefined while loading. */
  athleteSlugs: readonly string[] | undefined;
  /** The home payload failed: keep the button unavailable without a loading message. */
  isError?: boolean;
  /** Sibling actions rendered in the same row. */
  children?: ReactNode;
}

const t = HOME_TEXT.intro;

/**
 * "Me surpreenda" (doc 09 P1): draws among all athletes without repeating the last pick. With an empty database it
 * stays focusable but aria-disabled and explains why. Future: GET /api/athletes/random.
 */
export function RandomAthleteButton({ athleteSlugs, isError = false, children }: RandomAthleteButtonProps) {
  const noteId = useId();
  const navigate = useNavigate();
  const last = useRef<string | null>(null);
  const isLoading = athleteSlugs === undefined && !isError;
  const isEmpty = athleteSlugs?.length === 0;
  const unavailable = !athleteSlugs || athleteSlugs.length === 0;

  const onClick = () => {
    if (!athleteSlugs || unavailable) return;
    const pool = athleteSlugs.length > 1 ? athleteSlugs.filter((s) => s !== last.current) : athleteSlugs;
    const slug = pool[Math.floor(Math.random() * pool.length)];
    if (!slug) return;
    last.current = slug;
    void navigate({ to: '/athletes/$slug', params: { slug } });
  };

  return (
    <>
      <div className="row home-intro-actions">
        <Button variant="primary" aria-disabled={unavailable} aria-describedby={unavailable ? noteId : undefined} onClick={onClick}>
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
