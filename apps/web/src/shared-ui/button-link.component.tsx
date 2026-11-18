import { createLink, type LinkComponent } from '@tanstack/react-router';
import { type AnchorHTMLAttributes, forwardRef } from 'react';

import { type ButtonSize, type ButtonVariant, buttonClass } from './button.helper';

interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const ButtonAnchor = forwardRef<HTMLAnchorElement, ButtonAnchorProps>(function ButtonAnchor({ variant, size, className, ...rest }, ref) {
  // Content arrives through `rest.children` (the router link passes it along).
  // oxlint-disable-next-line jsx-a11y/anchor-has-content
  return <a ref={ref} className={buttonClass(variant, size, className)} {...rest} />;
});

const CreatedButtonLink = createLink(ButtonAnchor);

/** Typed router link that looks like a Button: `<ButtonLink to="/athletes" variant="primary">`. */
export const ButtonLink: LinkComponent<typeof ButtonAnchor> = (props) => <CreatedButtonLink preload="intent" {...props} />;
