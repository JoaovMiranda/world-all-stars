// WCAG 2.2 contrast of the theme tokens (1.4.3 text ≥ 4.5:1, 1.4.11 UI components and focus ring ≥ 3:1), in the
// light, dark and always-dark "stage" palettes. Reads packages/shared/src/theme/theme.css itself, so a token change that breaks a pair fails CI.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../../../packages/shared/src/theme/theme.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Custom properties declared in the first block whose selector is exactly `selector`. */
const block = (selector: string): Record<string, string> => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`theme.css: no block ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v!.trim()]));
};

const LIGHT = block(':root');
const DARK = { ...LIGHT, ...block(':root[data-theme="dark"]') };
const STAGE = block('.theme-stage');
const PALETTES = {
  light: LIGHT,
  dark: DARK,
  'stage (light page)': { ...LIGHT, ...STAGE },
  'stage (dark page)': { ...DARK, ...STAGE },
} as const;

const resolve = (tokens: Record<string, string>, name: string, depth = 0): string => {
  const value = tokens[name];
  if (!value) throw new Error(`missing token ${name}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  return ref && depth < 5 ? resolve(tokens, ref[1]!, depth + 1) : value;
};

const luminance = (hex: string) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a #rrggbb colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1]!.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const SURFACES = ['--bg', '--surface', '--surface-2'];
const TEXT_ON_SURFACES = [
  '--text', '--muted', '--primary', '--accent-text', '--success-text', '--danger-text', '--info-text',
  '--tier-mythic', '--tier-legendary', '--tier-elite', '--tier-champion',
];
const TEXT_ON_SURFACES_PAGE_ONLY = ['--gold-text', '--silver-text', '--bronze-text'];
/** [foreground, background] text pairs (text drawn on a filled colour). */
const TEXT_ON_FILL: [string, string][] = [
  ['--on-primary', '--primary'], ['--on-success', '--success'], ['--on-info', '--info'], ['--on-danger', '--danger'],
  ['--on-c-teal', '--c-teal'], ['--on-c-orange', '--c-orange'], ['--on-c-lime', '--c-lime'], ['--on-c-pink', '--c-pink'],
  ['--on-medal', '--medal-gold'], ['--on-medal', '--medal-silver'], ['--on-medal', '--medal-bronze'],
];
/** Non-text UI: form-control borders and the focus ring (`:focus-visible` outline = --primary). */
const UI_ON_SURFACES = ['--border-control', '--primary'];

type Case = { palette: string; fg: string; bg: string; min: number };
const cases: Case[] = Object.keys(PALETTES).flatMap((palette) => {
  const stage = palette.startsWith('stage');
  return [
    ...SURFACES.flatMap((bg) => [...TEXT_ON_SURFACES, ...(stage ? [] : TEXT_ON_SURFACES_PAGE_ONLY)].map((fg) => ({ palette, fg, bg, min: 4.5 }))),
    ...(stage ? [] : TEXT_ON_FILL.map(([fg, bg]) => ({ palette, fg, bg, min: 4.5 }))),
    ...SURFACES.flatMap((bg) => UI_ON_SURFACES.map((fg) => ({ palette, fg, bg, min: 3 }))),
  ];
});

describe('theme token contrast (WCAG 2.2 AA)', () => {
  it.each(cases)('$palette: $fg on $bg ≥ $min:1', ({ palette, fg, bg, min }) => {
    const tokens = PALETTES[palette as keyof typeof PALETTES];
    const ratio = contrast(resolve(tokens, fg), resolve(tokens, bg));
    expect(Number(ratio.toFixed(2)), `${resolve(tokens, fg)} on ${resolve(tokens, bg)}`).toBeGreaterThanOrEqual(min);
  });

  it('the dark override under prefers-color-scheme matches the [data-theme="dark"] block', () => {
    const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
    const body = media.slice(media.indexOf('{', media.indexOf(':root:not')) + 1, media.indexOf('}'));
    const auto = Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v!.trim()]));
    expect(auto).toEqual(block(':root[data-theme="dark"]'));
  });
});
