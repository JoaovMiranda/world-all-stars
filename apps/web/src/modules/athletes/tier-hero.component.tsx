import './tier-page.css';

import { type AthleteProfile, Tier } from '@was/shared';
import { type CSSProperties, useEffect, useRef, useSyncExternalStore } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { TierPortrait } from '@/shared-ui/tier-portrait.component';

/** Portrait width per tier: the higher the tier, the bigger the stage gives it (appeal + staging). */
const PORTRAIT_WIDTH: Record<Tier, number | undefined> = {
  [Tier.Mythic]: 260,
  [Tier.Legendary]: 204,
  [Tier.Elite]: 184,
  [Tier.Champion]: undefined,
};

/** ◆ that rise in arcs behind a Mythic hero: left (%), drift (px), duration (s), delay (s). Fixed so SSR = client. */
const SPARKS = [
  [6, 30, 9, 0.6],
  [18, -24, 11, 2.4],
  [33, 36, 10, 4.2],
  [52, -30, 12, 1.2],
  [68, 26, 9.5, 3.4],
  [84, -34, 11.5, 5.1],
  [94, 22, 10.5, 0],
] as const;

const seenKey = (slug: string) => `was:tier-ceremony:${slug}`;
const readSeen = (slug: string): boolean => {
  try {
    return window.sessionStorage.getItem(seenKey(slug)) === '1';
  } catch {
    return false;
  }
};
const noopSubscribe = () => () => undefined;

/**
 * Frequency of use: the full entrance ceremony plays the first time an athlete is opened in this tab; after that the
 * short version. Server render and hydration assume the first time (no mismatch).
 */
export function useTierCeremony(slug: string): { short: boolean } {
  // Read once per mount: our own "seen" mark must not cut the ceremony that is playing now.
  const first = useRef<boolean | null>(null);
  const short = useSyncExternalStore(
    noopSubscribe,
    () => (first.current ??= readSeen(slug)),
    () => false,
  );
  useEffect(() => {
    // Marked after the ceremony (≈ 1.6 s), so a quick re-render or StrictMode remount never sees it early.
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(seenKey(slug), '1');
      } catch {
        // Private mode or blocked storage: the ceremony simply plays again next time.
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [slug]);
  return { short };
}

/** Classes of the profile page wrapper: tier theme + ceremony length. */
export const tierPageClass = (tier: Tier, short: boolean) => `tier-page tier-page-${tier}${tier === Tier.Mythic ? ' theme-stage' : ''}${short ? ' tp-short' : ''}`;

/** Decoration behind the hero, by tier: Mythic stage (aurora, spotlight, rising ◆), metal light for the others. */
export function TierDecor({ tier }: { tier: Tier }) {
  if (tier === Tier.Champion) return null;
  return (
    <>
      <span className="tp-band" />
      {tier === Tier.Mythic && (
        <>
          <span className="tp-aurora" />
          <span className="tp-spot" />
          {SPARKS.map(([x, drift, dur, delay]) => (
            <span key={x} className="tp-spark" style={{ '--x': `${x}%`, '--drift': `${drift}px`, '--dur': `${dur}s`, '--delay': `${delay}s` } as CSSProperties}>
              <span>◆</span>
            </span>
          ))}
        </>
      )}
    </>
  );
}

/** Portrait sized by tier, with the Mythic seal "stamped" on its corner. */
export function TierMedia({ profile }: { profile: AthleteProfile }) {
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const width = PORTRAIT_WIDTH[profile.tier];
  return (
    <div className="tp-media">
      <TierPortrait name={profile.knownAs} tier={profile.tier} photo={profile.photo} {...(width ? { width } : {})} />
      {profile.tier === Tier.Mythic && (
        <span className="tp-seal" aria-hidden="true">
          <span>◆</span> {labels.tier.mythic}
        </span>
      )}
    </div>
  );
}

/** The Mythic's dossier headline as an epigraph under the name (only with an approved dossier). */
export function TierEpigraph({ profile }: { profile: AthleteProfile }) {
  const headline = profile.tier === Tier.Mythic ? profile.dossier?.headline : null;
  if (!headline) return null;
  return <p className="tp-epigraph">{headline}</p>;
}
