import { Outlet } from '@tanstack/react-router';

import { SessionProvider } from '@/session/session-provider.component';
import { DevFixtureSwitcher } from '@/shared-ui/dev-fixture-switcher.component';
import { LAYOUT_TEXT, MAIN_CONTENT_ID } from '@/shared-ui/layout.const';
import { SearchRow } from '@/shared-ui/search-row.component';
import { SiteFooter } from '@/shared-ui/site-footer.component';
import { SiteHeader } from '@/shared-ui/site-header.component';

import { useClientBoot } from './use-client-boot.hook';

/** Layout of every page (inside the RootDocument shell): skip link, header, search, content, footer. */
export function RootLayout() {
  useClientBoot();
  return (
    <SessionProvider>
      <a className="skip-link" href={`#${MAIN_CONTENT_ID}`}>
        {LAYOUT_TEXT.skipLink}
      </a>
      <SiteHeader />
      <SearchRow />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="wrap">
        <Outlet />
      </main>
      <SiteFooter />
      <DevFixtureSwitcher />
    </SessionProvider>
  );
}
