import type { Messages } from '@was/shared';

import type { SOURCE_ATTRIBUTION_TEXT } from './source-attribution.const';

export const SOURCE_ATTRIBUTION_TEXT_EN = {
  data: 'Data:',
  allSources: 'Sources and licenses',
  external: '(opens in a new tab)',
  licenseOf: (license) => `License ${license}`,
} satisfies Messages<typeof SOURCE_ATTRIBUTION_TEXT>;
