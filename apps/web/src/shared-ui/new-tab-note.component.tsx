import { useText } from '@/i18n/use-text.hook';

import { UI_MESSAGES } from './ui-text.const';

/** Screen-reader note at the end of a link that opens in a new tab: " (opens in a new tab)" (WCAG 3.2.5 / G201). */
export function NewTabNote() {
  const ui = useText(UI_MESSAGES);
  return <span className="sr-only"> {ui.external}</span>;
}
