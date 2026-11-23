import type { HomeResponse } from '@was/shared';
import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { CountUp } from '@/shared-ui/count-up.component';
import { prefersReducedMotion } from '@/shared-ui/motion.helper';
import { MotionToggle } from '@/shared-ui/motion-toggle.component';
import { ResponsiveImg } from '@/shared-ui/responsive-img.component';

import { HOME_MESSAGES } from './home.const';
import { RandomAthleteButton } from './random-athlete-button.component';

interface HomeStageProps {
  /** undefined while loading (the stage renders without portraits and numbers). */
  data: HomeResponse | undefined;
  isError?: boolean;
}

/** ◆ particles of the stage: horizontal start (%), drift (px), duration (s), delay (s). Fixed so SSR = client. */
const SPARKS = [
  [8, 40, 11, 0],
  [18, -30, 14, 3],
  [31, 50, 12, 6],
  [44, -45, 15, 1.5],
  [57, 35, 13, 8],
  [69, -40, 11.5, 4.5],
  [81, 45, 14.5, 2],
  [92, -35, 12.5, 7],
] as const;

/** Splits a sentence into words that rise one by one (staging: the title assembles itself). */
function Words({ text, start, em = false, tail }: { text: string; start: number; em?: boolean; tail?: string | undefined }) {
  const words = text.split(/(\s+)/);
  const last = words.findLastIndex((w) => w.trim());
  let i = start;
  const nodes = words.map((w, k) => {
    if (!w.trim()) return w;
    const node = (
      <span key={k} className="w" style={{ '--w': i } as CSSProperties}>
        <span>{w}</span>
        {/* Punctuation that follows (", com") stays glued to this word: no line break before it. */}
        {k === last && tail && <span className="w-tail">{tail}</span>}
      </span>
    );
    i += 1;
    return node;
  });
  return em ? <em>{nodes}</em> : <>{nodes}</>;
}

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** One looping row of portraits (rendered twice so the -50% translate loops seamlessly). */
function Reel({ greats, reverse }: { greats: HomeResponse['greats']; reverse?: boolean }): ReactNode {
  const items = greats.filter((g) => g.photo);
  if (items.length === 0) return null;
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className={reverse ? 'stage-reel stage-reel-rev' : 'stage-reel'}>
      {loop.map((g, i) => (
        <figure key={`${g.slug}-${i}`} className="stage-face">
          {g.photo && <ResponsiveImg url={g.photo.url} displayWidth={180} loading="lazy" />}
        </figure>
      ))}
    </div>
  );
}

/**
 * Home hero "Mythic stage": always-dark full-bleed stage with two reels of Mythic portraits, a spotlight that
 * follows the mouse, ◆ rising in arcs, the title assembling word by word and the collection in counting numbers.
 * On scroll the content lifts away faster than the background (scroll-driven, where supported).
 */
export function HomeStage({ data, isError = false }: HomeStageProps) {
  const t = useText(HOME_MESSAGES).intro;
  const ref = useRef<HTMLElement>(null);

  // Spotlight follows the pointer (fine pointers only); reels pause while the stage is off screen.
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty('--sy', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      });
    };
    const io = new IntersectionObserver(([entry]) => el.classList.toggle('is-offscreen', !entry?.isIntersecting));
    io.observe(el);
    el.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      el.removeEventListener('pointermove', onMove);
    };
  }, []);

  const greats = data?.greats ?? [];
  const stats = data && [
    { key: 'athletes', label: t.stats.athletes, value: data.totalAthletes },
    { key: 'sports', label: t.stats.sports, value: data.sports.length },
    { key: 'mythics', label: t.stats.mythics, value: data.sports.reduce((n, s) => n + s.mythic, 0) },
    { key: 'titles', label: t.stats.titles, value: data.globe.reduce((n, c) => n + c.totalTitles, 0) },
  ];
  // Leading punctuation of the sentence end (", com dados…") is glued to the highlight's last word.
  const tail = /^[^\s\p{L}\p{N}]+/u.exec(t.titleAfter)?.[0];
  const after = tail ? t.titleAfter.slice(tail.length) : t.titleAfter;
  const beforeWords = wordCount(t.titleBefore);
  const highlightWords = wordCount(t.titleHighlight);

  return (
    <section ref={ref} className="home-stage theme-stage" aria-labelledby="home-title">
      <span className="home-progress" aria-hidden="true" />
      <div className="stage-bg" aria-hidden="true">
        <Reel greats={greats} />
        <Reel greats={[...greats].reverse()} reverse />
        <span className="stage-veil" />
        <span className="stage-spot" />
        {SPARKS.map(([x, drift, dur, delay]) => (
          <span
            key={x}
            className="stage-spark"
            style={{ '--x': `${x}%`, '--drift': `${drift}px`, '--dur': `${dur}s`, '--delay': `${delay}s` } as CSSProperties}
          >
            <span>◆</span>
          </span>
        ))}
      </div>

      <div className="stage-content">
        <span className="label ornament">{t.kicker}</span>
        <h1 id="home-title">
          <Words text={t.titleBefore} start={0} />
          <Words text={t.titleHighlight} start={beforeWords} em tail={tail} />
          <Words text={after} start={beforeWords + highlightWords} />
        </h1>
        <p className="stage-sub">{t.subtitle}</p>
        <RandomAthleteButton athleteSlugs={data?.athleteSlugs} isError={isError}>
          <ButtonLink to="/athletes">{t.allAthletes}</ButtonLink>
        </RandomAthleteButton>
        <dl className="stage-stats" aria-label={t.stats.label}>
          {stats
            ? stats.map((s) => (
                <div key={s.key}>
                  <dt>{s.label}</dt>
                  <dd className="display-num">
                    <CountUp value={s.value} />
                  </dd>
                </div>
              ))
            : [0, 1, 2, 3].map((i) => (
                <div key={i} aria-hidden="true">
                  <dt>&nbsp;</dt>
                  <dd className="display-num">—</dd>
                </div>
              ))}
        </dl>
      </div>
      {/* The reels and sparks loop forever: a visible pause right where they move (WCAG 2.2.2). */}
      <MotionToggle variant="text" className="stage-pause" />
    </section>
  );
}
