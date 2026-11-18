import { LOCALE_AUTONYMS, LOCALE_SHORT, LOCALE_VALUES, type Locale } from '@was/shared';
import { useRouter } from '@tanstack/react-router';
import { useRef } from 'react';

import { localeStore, useLocale } from '@/i18n/locale.store';
import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { LAYOUT_MESSAGES } from './layout.const';
import { useDisclosure } from './use-disclosure.hook';
import { useDismiss } from './use-dismiss.hook';

/**
 * Language menu (doc 12: same URL). Switching saves the `was_locale` cookie, re-renders the page in place and
 * re-runs the route loaders (titles, localized API data); nothing reloads and the URL stays the same.
 */
export function LanguageSwitcher() {
  const t = useText(LAYOUT_MESSAGES);
  const locale = useLocale();
  const router = useRouter();
  const menu = useDisclosure();
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, menu.open, menu.close);

  const choose = (next: Locale) => {
    menu.close();
    if (next === locale) return;
    localeStore.set(next);
    void router.invalidate();
  };

  return (
    <div className="menu lang-switch" ref={root}>
      <Button className="header-lang" {...menu.buttonProps} aria-haspopup="true" aria-label={t.languageLabel(LOCALE_AUTONYMS[locale])} title={t.languageLabel(LOCALE_AUTONYMS[locale])}>
        {LOCALE_SHORT[locale]}
      </Button>
      {menu.open && (
        <div className="menu-pop menu-pop-narrow" id={menu.contentId}>
          <span className="label px-2.5">{t.languageMenu}</span>
          <ul className="menu-list" aria-label={t.languageMenu}>
            {LOCALE_VALUES.map((l) => (
              <li key={l}>
                <button type="button" className="menu-item" lang={l} aria-current={l === locale ? 'true' : undefined} onClick={() => choose(l)}>
                  {LOCALE_AUTONYMS[l]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
