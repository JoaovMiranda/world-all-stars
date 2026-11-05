import { tokenColor } from './format.helper';

/** Small dot with the sport color token (decorative). */
export function SportDot({ colorToken }: { colorToken: string }) {
  return <span className="sport-dot" style={{ background: tokenColor(colorToken) }} aria-hidden="true" />;
}
