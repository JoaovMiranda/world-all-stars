import type { Messages } from '@was/shared';

import type { SOURCE_ATTRIBUTION_TEXT } from './source-attribution.const';

export const SOURCE_ATTRIBUTION_TEXT_ES = {
  data: 'Datos:',
  allSources: 'Fuentes y licencias',
  external: '(se abre en una pestaña nueva)',
  licenseOf: (license) => `Licencia ${license}`,
} satisfies Messages<typeof SOURCE_ATTRIBUTION_TEXT>;
