import type { CompetitionLevel } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';

import { DOMAIN_LABELS_MESSAGES } from './domain-labels.const';

/** Competition level badge: Mundial (gold text) · Continental · Nacional · Local. */
export function LevelTag({ level }: { level: CompetitionLevel }) {
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  return <span className={`tag tag-lvl-${level}`}>{labels.level[level]}</span>;
}
