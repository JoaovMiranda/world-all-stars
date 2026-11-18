import { z } from 'zod';

import { LOCALE_VALUES } from '../i18n/locale.const';

export const LocaleSchema = z.enum(LOCALE_VALUES);

/**
 * Language the main content of a detail response actually came in (requested → pt-BR → en → any). Optional: absent
 * means "the requested one". The web shows a discreet note when it differs from the interface language.
 */
export const ContentLocaleSchema = LocaleSchema.optional();
