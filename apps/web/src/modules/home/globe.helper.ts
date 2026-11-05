import { GLOBE } from './globe.const';

/** Fill of a country: neutral land when it has no titles, otherwise a mix towards --primary (theme-aware via CSS). */
export const countryFill = (titles: number, maxTitles: number): string => {
  if (titles <= 0 || maxTitles <= 0) return 'var(--land)';
  const pct = Math.round(25 + (75 * titles) / maxTitles);
  return `color-mix(in oklab, var(--primary) ${pct}%, var(--land))`;
};

/** Geometry of the desk stand (meridian arc, pivots, column and base). */
export const standGeometry = () => {
  const { cx, cy, radius, tilt } = GLOBE;
  const rad = (tilt * Math.PI) / 180;
  const rr = radius + 12;
  const point = (a: number): [number, number] => [cx + rr * Math.sin(a + rad), cy - rr * Math.cos(a + rad)];
  const [x1, y1] = point(-Math.PI * 0.08);
  const [x2, y2] = point(Math.PI * 1.08);
  const columnTop = cy + radius + 6;
  return {
    arc: `M ${x1} ${y1} A ${rr} ${rr} 0 1 1 ${x2} ${y2}`,
    pivotTop: point(0),
    pivotBottom: point(Math.PI),
    column: { x: cx - 5, y: columnTop, height: 428 - columnTop - 12 },
    base: `M ${cx - 70} 428 Q ${cx} 404 ${cx + 70} 428 Z`,
  };
};

export const clampLatitude = (lat: number): number => Math.max(-GLOBE.maxLatitude, Math.min(GLOBE.maxLatitude, lat));
