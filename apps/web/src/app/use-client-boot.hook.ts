import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { DATA_SOURCE, FIXTURE_MODE_PARAM } from '@/data/data-layer.const';
import { demoStore } from '@/data/demo.store';
import { fixtureModeStore } from '@/data/fixture-mode.store';
import { sessionStore } from '@/session/session.store';
import { migrateLegacyTheme } from '@/shared-ui/theme.helper';

/**
 * Runs once after hydration (browser only): what the server could not know. Keeps `?fixture=` in its cookie,
 * migrates pre-SSR localStorage choices (theme, session) to cookies, and overlays the tester's demo changes
 * (localStorage) on the server-rendered fixture data.
 */
export function useClientBoot(): void {
  const client = useQueryClient();
  useEffect(() => {
    if (new URL(window.location.href).searchParams.has(FIXTURE_MODE_PARAM)) fixtureModeStore.persist();
    migrateLegacyTheme();
    sessionStore.migrateLegacy();
    if (DATA_SOURCE === 'fixtures' && demoStore.hasStored()) void client.invalidateQueries();
  }, [client]);
}
