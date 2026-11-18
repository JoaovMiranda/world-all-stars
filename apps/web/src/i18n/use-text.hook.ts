import { type LocalizedMessages, type Messages, textFor } from '@was/shared';

import { useLocale } from './locale.store';

/** Dictionary of a module in the current language: `const t = useText(HOME_MESSAGES).intro`. */
export const useText = <T>(messages: LocalizedMessages<T>): Messages<T> => textFor(messages, useLocale());
