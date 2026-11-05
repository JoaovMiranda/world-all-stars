/** Desk globe geometry (SVG units, viewBox 400 × 448) and motion. Mirrors plan/front-prototype globe.component.js. */
export const GLOBE = {
  width: 400,
  height: 448,
  radius: 168,
  cx: 200,
  cy: 190,
  /** Earth axial tilt, used as the gamma rotation of the projection. */
  tilt: 23.4,
  initialRotation: [40, -10] as const,
  /** Degrees per animation frame of the idle spin. */
  autoSpinStep: 0.07,
  keyboardStep: 10,
  maxLatitude: 80,
} as const;
