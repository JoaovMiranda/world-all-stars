import { Link, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Button } from './button.component';
import { LAYOUT_TEXT } from './layout.const';
import { MainNavLinks } from './main-nav.component';
import { SessionMenu } from './session-menu.component';
import { ThemeToggle } from './theme-toggle.component';
import { useDisclosure } from './use-disclosure.hook';

/** Sticky header: logo · nav (≥ 960 px) or menu button · language · theme · session menu. */
export function SiteHeader() {
  const mobile = useDisclosure();
  const { pathname } = useLocation();
  const { close } = mobile;
  useEffect(close, [pathname, close]);

  return (
    <header className="site-header">
      <div className="wrap bar">
        <Button
          variant="secondary"
          size="icon"
          className="nav-toggle"
          aria-label={mobile.open ? LAYOUT_TEXT.menuClose : LAYOUT_TEXT.menuOpen}
          {...mobile.buttonProps}
        >
          <span aria-hidden="true">{mobile.open ? '×' : '☰'}</span>
        </Button>
        <Link to="/" className="logo">
          <i aria-hidden="true" />
          {LAYOUT_TEXT.brand}
        </Link>
        <nav className="main-nav" aria-label={LAYOUT_TEXT.navLabel}>
          <MainNavLinks />
        </nav>
        <Button className="header-lang" aria-label={LAYOUT_TEXT.languageLabel} title={LAYOUT_TEXT.languageLabel}>
          {LAYOUT_TEXT.language}
        </Button>
        <ThemeToggle />
        <SessionMenu />
      </div>
      {mobile.open && (
        <nav className="mobile-nav" id={mobile.contentId} aria-label={LAYOUT_TEXT.navLabel}>
          <div className="wrap">
            <MainNavLinks onNavigate={mobile.close} />
          </div>
        </nav>
      )}
    </header>
  );
}
