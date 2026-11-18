import { HeadContent, Scripts } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useLocale } from '@/i18n/locale.store';

import { useBoot } from './use-boot.hook';

/**
 * The whole HTML document (root `shellComponent`): rendered by the server and hydrated by entry-client. The theme
 * cookie becomes <html data-theme> here and the locale <html lang>, so the first paint already has the right colors (no inline script).
 */
export function RootDocument({ children }: { children: ReactNode }) {
  const { theme } = useBoot();
  const locale = useLocale();
  return (
    <html lang={locale} {...(theme ? { 'data-theme': theme } : {})}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
