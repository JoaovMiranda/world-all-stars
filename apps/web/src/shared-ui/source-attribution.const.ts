import { defineMessages } from '@was/shared';

import { SOURCE_ATTRIBUTION_TEXT_EN } from './source-attribution.const.en';
import { SOURCE_ATTRIBUTION_TEXT_ES } from './source-attribution.const.es';

// Visible data-source credit (T4.6): pt-BR source; en/es next to it.
export const SOURCE_ATTRIBUTION_TEXT = {
  data: 'Dados:',
  allSources: 'Fontes e licenças',
  external: '(abre em nova aba)',
  licenseOf: (license: string) => `Licença ${license}`,
} as const;

export const SOURCE_ATTRIBUTION_MESSAGES = defineMessages(SOURCE_ATTRIBUTION_TEXT, { en: SOURCE_ATTRIBUTION_TEXT_EN, es: SOURCE_ATTRIBUTION_TEXT_ES });
