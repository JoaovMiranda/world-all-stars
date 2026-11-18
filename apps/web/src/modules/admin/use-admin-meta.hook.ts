import { type Locale, type Messages, textFor } from '@was/shared';

import { localeStore, useLocale } from '@/i18n/locale.store';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import type { TagTone } from '@/shared-ui/tag.component';

import { ADMIN_LABELS_MESSAGES, ADMIN_LABELS_TEXT, ADMIN_STATUS_TONES, type StatusMeta } from './admin-labels.const';

const withTones = <K extends string>(labels: Readonly<Record<K, string>>, tones: Record<K, TagTone>): Record<K, StatusMeta> =>
  Object.fromEntries(Object.keys(tones).map((k) => [k, { label: labels[k as K], tone: tones[k as K] }])) as Record<K, StatusMeta>;

const build = (locale: Locale) => {
  const l: Messages<typeof ADMIN_LABELS_TEXT> = textFor(ADMIN_LABELS_MESSAGES, locale);
  const t = ADMIN_STATUS_TONES;
  return {
    ...l,
    reviewStatus: withTones(l.reviewStatus, t.reviewStatus),
    dossierStatus: withTones(l.dossierStatus, t.dossierStatus),
    runStatus: withTones(l.runStatus, t.runStatus),
    privacyStatus: withTones(l.privacyStatus, t.privacyStatus),
    deadline: withTones(l.deadline, t.deadline),
    suggestionStatus: withTones(l.suggestionStatus, t.suggestionStatus),
    contactStatus: withTones(l.contactStatus, t.contactStatus),
    commentStatus: withTones(l.commentStatus, t.commentStatus),
    sourceUsage: withTones(textFor(DOMAIN_LABELS_MESSAGES, locale).sourceUsage, t.sourceUsage),
    userRole: withTones(l.userRole, t.userRole),
  };
};
export type AdminMeta = ReturnType<typeof build>;
const cache = new Map<Locale, AdminMeta>();
const metaFor = (locale: Locale): AdminMeta => {
  let hit = cache.get(locale);
  if (!hit) cache.set(locale, (hit = build(locale)));
  return hit;
};

/** Admin status labels (+ tag tones) and value labels in the current language. */
export const useAdminMeta = (): AdminMeta => metaFor(useLocale());
/** Same, outside React (helpers): reads the locale at call time. */
export const currentAdminMeta = (): AdminMeta => metaFor(localeStore.get());
