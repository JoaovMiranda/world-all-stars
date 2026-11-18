import { type ElementType, type HTMLAttributes, type ReactNode, useRef } from 'react';

import { cx } from './class-names.helper';
import { useReveal } from './use-reveal.hook';

export type RevealVariant = 'rise' | 'fade' | 'curtain' | 'draw';

interface RevealProps extends HTMLAttributes<HTMLElement> {
  /** Element to render (section, ul, div…). Default div. */
  as?: ElementType;
  /** rise (default): fades in moving up · fade · curtain: opens from the centre · draw: grows from the left. */
  variant?: RevealVariant;
  /** Children enter one after another (60 ms apart) instead of the block at once. */
  stagger?: boolean;
  /** Plays once per page: after going back the block is simply there. */
  name?: string;
  children?: ReactNode;
}

/** Block that assembles itself when scrolled into view (see useReveal). Renders normally on the server. */
export function Reveal({ as: Tag = 'div', variant = 'rise', stagger = false, name, className, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { name, stagger });
  return (
    <Tag ref={ref} className={cx('reveal', className)} data-variant={variant} data-stagger={stagger || undefined} {...rest}>
      {children}
    </Tag>
  );
}
