import { type LocalizedMessages, type Messages, textFor } from '@was/shared';

import { localeStore } from './locale.store';

/** Dictionary in the current language outside React (route loaders/head, fixtures): `currentText(HOME_MESSAGES)`. */
export const currentText = <T>(messages: LocalizedMessages<T>): Messages<T> => textFor(messages, localeStore.get());
