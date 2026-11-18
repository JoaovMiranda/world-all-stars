import type { Locale } from '@was/shared';

import { useLocale } from '@/i18n/locale.store';
import { useFormat } from '@/i18n/use-format.hook';
import { useText } from '@/i18n/use-text.hook';

import { Notice } from './notice.component';
import { UI_MESSAGES } from './ui-text.const';

/**
 * Discreet note when the content of a page (athlete bio, sport texts…) came in another language than the interface:
 * the API falls back requested → pt-BR → en and reports `contentLocale` (doc 12 i18n).
 */
export function UntranslatedNote({ contentLocale }: { contentLocale: Locale | undefined }) {
  const locale = useLocale();
  const fmt = useFormat();
  const ui = useText(UI_MESSAGES);
  if (!contentLocale || contentLocale === locale) return null;
  return (
    <Notice tone="info" className="untranslated-note">
      {ui.untranslated(fmt.language(contentLocale))}
    </Notice>
  );
}
