import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { type KeyboardEvent, type PointerEvent, useEffect, useId, useMemo, useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { useReducedMotion } from '@/shared-ui/motion-preference';
import { useInViewOnce } from '@/shared-ui/use-reveal.hook';

import { countryNameFromNumeric } from './country-name.helper';
import { GLOBE } from './globe.const';
import { clampLatitude, countryFill, standGeometry } from './globe.helper';
import { HOME_MESSAGES } from './home.const';
import type { CountryFeature } from './use-world-atlas.hook';

interface DeskGlobeProps {
  features: CountryFeature[] | undefined;
  /** Titles per ISO numeric code (empty map = neutral globe). */
  titlesByCountry: ReadonlyMap<string, number>;
  selectedId: string | null;
  onSelect: (feature: CountryFeature) => void;
}

const SPHERE = { type: 'Sphere' } as const;
const GRATICULE = geoGraticule10();

/** Desk globe (doc 08): orthographic d3-geo projection, draggable, keyboard-rotatable, idle spin unless reduced motion. */
export function DeskGlobe({ features, titlesByCountry, selectedId, onSelect }: DeskGlobeProps) {
  const homeText = useText(HOME_MESSAGES);
  const shadeId = useId();
  const reduced = useReducedMotion();
  const oceanRef = useRef<SVGPathElement>(null);
  const graticuleRef = useRef<SVGPathElement>(null);
  const shadeRef = useRef<SVGPathElement>(null);
  const rimRef = useRef<SVGPathElement>(null);
  const landRef = useRef<SVGGElement>(null);
  const autoSpin = useRef(true);
  const drag = useRef<{
    x: number;
    y: number;
    rotate: [number, number, number];
    moved: boolean;
    countryId: string | null;
    /** Last sample and smoothed angular velocity (deg/ms), for the throw on release. */
    t: number;
    l: number;
    p: number;
    vl: number;
    vp: number;
  } | null>(null);
  /** Follow-through: degrees per frame left over from a throw; decays until the globe rests. */
  const momentum = useRef<[number, number] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Follow-through on arrival: the globe is "thrown" ~110° when it scrolls in, then settles into the idle spin.
  useInViewOnce(svgRef, () => {
    if (!drag.current && !momentum.current) momentum.current = [GLOBE.arrivalSpin, 0];
  });

  const projection = useMemo(
    () =>
      geoOrthographic()
        .scale(GLOBE.radius)
        .translate([GLOBE.cx, GLOBE.cy])
        .clipAngle(90)
        .rotate([GLOBE.initialRotation[0], GLOBE.initialRotation[1], GLOBE.tilt]),
    [],
  );
  const stand = useMemo(standGeometry, []);
  const maxTitles = useMemo(() => Math.max(0, ...titlesByCountry.values()), [titlesByCountry]);

  // Redraws every path imperatively (60 fps while spinning/dragging without React renders).
  const draw = useMemo(() => {
    const path = geoPath(projection);
    return () => {
      oceanRef.current?.setAttribute('d', path(SPHERE) ?? '');
      graticuleRef.current?.setAttribute('d', path(GRATICULE) ?? '');
      shadeRef.current?.setAttribute('d', path(SPHERE) ?? '');
      rimRef.current?.setAttribute('d', path(SPHERE) ?? '');
      const land = landRef.current;
      if (!land || !features) return;
      land.querySelectorAll('path').forEach((el, i) => {
        const f = features[i];
        if (f) el.setAttribute('d', path(f) ?? '');
      });
    };
  }, [projection, features]);

  useEffect(() => {
    draw();
    if (reduced) return;
    let frame = requestAnimationFrame(function spin() {
      const m = momentum.current;
      if (m) {
        const [l, p] = projection.rotate();
        projection.rotate([l + m[0], clampLatitude(p + m[1]), GLOBE.tilt]);
        draw();
        m[0] *= GLOBE.momentumDecay;
        m[1] *= GLOBE.momentumDecay;
        if (Math.abs(m[0]) + Math.abs(m[1]) < 0.02) momentum.current = null;
      } else if (autoSpin.current) {
        const [l, p, g] = projection.rotate();
        projection.rotate([l + GLOBE.autoSpinStep, p, g]);
        draw();
      }
      frame = requestAnimationFrame(spin);
    });
    return () => cancelAnimationFrame(frame);
  }, [draw, projection, reduced]);

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    autoSpin.current = false;
    momentum.current = null;
    // O país sob o ponteiro é lido AGORA: com setPointerCapture, o click iria para o <svg> e nunca para o <path>.
    const countryId = (event.target as Element).closest('[data-country-id]')?.getAttribute('data-country-id') ?? null;
    const [l0, p0] = projection.rotate();
    drag.current = { x: event.clientX, y: event.clientY, rotate: projection.rotate(), moved: false, countryId, t: event.timeStamp, l: l0, p: p0, vl: 0, vp: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add('dragging');
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const scale = GLOBE.width / event.currentTarget.getBoundingClientRect().width;
    const k = 75 / GLOBE.radius;
    const dx = (event.clientX - d.x) * scale;
    const dy = (event.clientY - d.y) * scale;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    const l = d.rotate[0] + dx * k;
    const p = clampLatitude(d.rotate[1] - dy * k);
    const dt = event.timeStamp - d.t;
    if (dt > 0) {
      // Smoothed so one jittery sample does not decide the throw.
      d.vl = 0.7 * ((l - d.l) / dt) + 0.3 * d.vl;
      d.vp = 0.7 * ((p - d.p) / dt) + 0.3 * d.vp;
      Object.assign(d, { t: event.timeStamp, l, p });
    }
    projection.rotate([l, p, GLOBE.tilt]);
    draw();
  };
  const onPointerEnd = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.classList.remove('dragging');
    const d = drag.current;
    drag.current = null;
    // Released mid-motion: keep spinning and slow down (only if the pointer was still moving in the last 80 ms).
    if (d?.moved && event.type !== 'pointercancel' && event.timeStamp - d.t < 80) {
      const cap = GLOBE.momentumMax;
      const frameMs = 16;
      momentum.current = [Math.max(-cap, Math.min(cap, d.vl * frameMs)), Math.max(-cap, Math.min(cap, d.vp * frameMs))];
    }
    if (!d || d.moved || !d.countryId || event.type === 'pointercancel') return;
    const feature = features?.find((f, i) => String(f.id ?? i) === d.countryId);
    if (feature) onSelect(feature);
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-GLOBE.keyboardStep, 0],
      ArrowRight: [GLOBE.keyboardStep, 0],
      ArrowUp: [0, -GLOBE.keyboardStep],
      ArrowDown: [0, GLOBE.keyboardStep],
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    autoSpin.current = false;
    const [l, p] = projection.rotate();
    projection.rotate([l + step[0], clampLatitude(p + step[1]), GLOBE.tilt]);
    draw();
  };

  const viewBox = `0 0 ${GLOBE.width} ${GLOBE.height}`;
  return (
    <div className="globe-stage">
      <svg className="globe-stand" viewBox={viewBox} aria-hidden="true">
        <ellipse cx={GLOBE.cx} cy={430} rx={78} ry={12} style={{ fill: 'var(--metal-2)' }} opacity={0.35} />
        <path d={stand.base} style={{ fill: 'var(--metal-2)' }} />
        <rect x={stand.column.x} y={stand.column.y} width={10} height={stand.column.height} rx={3} style={{ fill: 'var(--metal)' }} />
        <path d={stand.arc} fill="none" strokeWidth={7} strokeLinecap="round" style={{ stroke: 'var(--metal)' }} />
        <circle cx={stand.pivotTop[0]} cy={stand.pivotTop[1]} r={5} style={{ fill: 'var(--metal-2)' }} />
        <circle cx={stand.pivotBottom[0]} cy={stand.pivotBottom[1]} r={5} style={{ fill: 'var(--metal-2)' }} />
      </svg>
      <svg
        ref={svgRef}
        className="globe-svg"
        viewBox={viewBox}
        // Focusable widget with its own arrow keys (rotation); country choice has a list equivalent (globe-panel chips).
        role="application"
        aria-roledescription={homeText.globe.roleDescription}
        aria-label={homeText.globe.ariaLabel}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- role=application is an interactive widget
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
      >
        <defs>
          <radialGradient id={shadeId} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.28} />
          </radialGradient>
        </defs>
        <path ref={oceanRef} style={{ fill: 'var(--ocean)' }} />
        <path ref={graticuleRef} fill="none" strokeWidth={0.4} style={{ stroke: 'var(--border)' }} />
        <g ref={landRef}>
          {features?.map((f, i) => {
            const id = String(f.id ?? i);
            return (
              <path
                key={id}
                className={id === selectedId ? 'country sel' : 'country'}
                style={{ fill: countryFill(titlesByCountry.get(id) ?? 0, maxTitles) }}
                data-country-id={id}
              >
                <title>{countryNameFromNumeric(f.id, f.properties.name)}</title>
              </path>
            );
          })}
        </g>
        <path ref={shadeRef} fill={`url(#${shadeId})`} pointerEvents="none" />
        <path ref={rimRef} fill="none" strokeWidth={1} style={{ stroke: 'var(--metal)' }} />
      </svg>
    </div>
  );
}
