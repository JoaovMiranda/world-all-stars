import type { CrossSportBand } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { cx } from '@/shared-ui/class-names.helper';

import { CROSS_SPORT_MESSAGES } from './cross-sport.const';

interface CrossSportBandBadgeProps {
  band: CrossSportBand;
  size?: 'md' | 'sm';
  /** Next to text that already names the band (headings, tables): hidden from assistive tech. */
  decorative?: boolean;
}

/** Band letter as visible text (never colour alone) with its full name for assistive tech. */
export function CrossSportBandBadge({ band, size = 'md', decorative = false }: CrossSportBandBadgeProps) {
  const t = useText(CROSS_SPORT_MESSAGES).bands;
  return (
    <span
      className={cx('band-badge', size === 'sm' && 'band-badge-sm')}
      data-band={band}
      title={t.names[band]}
      {...(decorative ? { 'aria-hidden': true } : {})}
    >
      <span aria-hidden="true">{band}</span>
      {!decorative && <span className="sr-only">{`${t.letter(band)} · ${t.names[band]}`}</span>}
    </span>
  );
}
