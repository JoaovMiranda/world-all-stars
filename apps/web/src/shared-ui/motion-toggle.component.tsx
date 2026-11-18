import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { cx } from './class-names.helper';
import { LAYOUT_MESSAGES } from './layout.const';
import { setMotionPaused, useMotionPaused } from './motion-preference';

/** "Pausar animações" (WCAG 2.2.2): one switch for every looping or decorative animation of the site. */
export function MotionToggle({ variant = 'icon', className }: { variant?: 'icon' | 'text'; className?: string }) {
  const layout = useText(LAYOUT_MESSAGES);
  const paused = useMotionPaused();
  const toggle = () => setMotionPaused(!paused);
  if (variant === 'text') {
    return (
      <Button size="sm" variant="ghost" className={cx('motion-toggle', className)} aria-pressed={paused} onClick={toggle}>
        <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span> {layout.pauseAnimations}
      </Button>
    );
  }
  return (
    <Button size="icon" className={className} aria-pressed={paused} onClick={toggle} aria-label={layout.pauseAnimations} title={layout.pauseAnimations}>
      <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
    </Button>
  );
}
