import type { Locale } from '@was/shared';

import { useLocale } from '@/i18n/locale.store';

/**
 * `lang` for API prose (bio, headline, description) when the API fell back to another language than the interface
 * (`contentLocale`): screen readers then switch voice for that passage (WCAG 3.1.2). undefined = same as the page.
 */
export function useContentLang(contentLocale: Locale | undefined): Locale | undefined {
  const locale = useLocale();
  return contentLocale && contentLocale !== locale ? contentLocale : undefined;
}
