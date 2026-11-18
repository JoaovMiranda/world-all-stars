import { Link, useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { LanguageSwitcher } from './language-switcher.component';
import { LAYOUT_MESSAGES } from './layout.const';
import { MainNavLinks } from './main-nav.component';
import { MotionToggle } from './motion-toggle.component';
import { SessionMenu } from './session-menu.component';
import { ThemeToggle } from './theme-toggle.component';
import { useDisclosure } from './use-disclosure.hook';
import { useDismiss } from './use-dismiss.hook';
import { useSlidingIndicator } from './use-sliding-indicator.hook';

/** Sticky header: logo · nav (≥ 960 px) or menu button · language · theme · session menu. */
export function SiteHeader() {
  const layout = useText(LAYOUT_MESSAGES);
  const mobile = useDisclosure();
  const { pathname } = useLocation();
  const { close } = mobile;
  useEffect(close, [pathname, close]);
  const navRef = useRef<HTMLElement>(null);
  // Mobile menu: Escape, a tap outside or Tab past it closes it, and focus returns to ☰.
  const headerRef = useRef<HTMLElement>(null);
  useDismiss(headerRef, mobile.open, close);
  useSlidingIndicator(navRef, 'a[aria-current="page"]:not(.nav-featured)', pathname);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="wrap bar">
        <Button
          variant="secondary"
          size="icon"
          className="nav-toggle"
          // Fixed name: aria-expanded already says open/closed (a changing label would announce the state twice).
          aria-label={layout.menuOpen}
          {...mobile.buttonProps}
        >
          <span aria-hidden="true">{mobile.open ? '×' : '☰'}</span>
        </Button>
        <Link to="/" className="logo">
          <i aria-hidden="true" />
          {layout.brand}
        </Link>
        <nav ref={navRef} className="main-nav" aria-label={layout.navLabel}>
          <MainNavLinks />
        </nav>
        <LanguageSwitcher />
        <MotionToggle className="header-motion" />
        <ThemeToggle />
        <SessionMenu />
      </div>
      {mobile.open && (
        <nav className="mobile-nav" id={mobile.contentId} aria-label={layout.navLabel}>
          <div className="wrap">
            <MainNavLinks onNavigate={mobile.close} />
            {/* Narrow screens: the header has no room for the icon, the switch lives in the menu (WCAG 2.2.2). */}
            <MotionToggle variant="text" className="mobile-motion" />
          </div>
        </nav>
      )}
    </header>
  );
}
