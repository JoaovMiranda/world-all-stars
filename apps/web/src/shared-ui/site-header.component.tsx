import { Link, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { LanguageSwitcher } from './language-switcher.component';
import { LAYOUT_MESSAGES } from './layout.const';
import { MainNavLinks } from './main-nav.component';
import { SessionMenu } from './session-menu.component';
import { ThemeToggle } from './theme-toggle.component';
import { useDisclosure } from './use-disclosure.hook';

/** Sticky header: logo · nav (≥ 960 px) or menu button · language · theme · session menu. */
export function SiteHeader() {
  const layout = useText(LAYOUT_MESSAGES);
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
          aria-label={mobile.open ? layout.menuClose : layout.menuOpen}
          {...mobile.buttonProps}
        >
          <span aria-hidden="true">{mobile.open ? '×' : '☰'}</span>
        </Button>
        <Link to="/" className="logo">
          <i aria-hidden="true" />
          {layout.brand}
        </Link>
        <nav className="main-nav" aria-label={layout.navLabel}>
          <MainNavLinks />
        </nav>
        <LanguageSwitcher />
        <ThemeToggle />
        <SessionMenu />
      </div>
      {mobile.open && (
        <nav className="mobile-nav" id={mobile.contentId} aria-label={layout.navLabel}>
          <div className="wrap">
            <MainNavLinks onNavigate={mobile.close} />
          </div>
        </nav>
      )}
    </header>
  );
}
