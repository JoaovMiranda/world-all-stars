import { HeadContent, Scripts } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useBoot } from './use-boot.hook';

/**
 * The whole HTML document (root `shellComponent`): rendered by the server and hydrated by entry-client. The theme
 * cookie becomes <html data-theme> here, so the first paint already has the right colors (no inline script).
 */
export function RootDocument({ children }: { children: ReactNode }) {
  const { theme } = useBoot();
  return (
    <html lang="pt-BR" {...(theme ? { 'data-theme': theme } : {})}>
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
