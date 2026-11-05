import type { CompetitionLevel } from '@was/shared';

import { LEVEL_LABEL } from './domain-labels.const';

/** Competition level badge: Mundial (gold text) · Continental · Nacional · Local. */
export function LevelTag({ level }: { level: CompetitionLevel }) {
  return <span className={`tag tag-lvl-${level}`}>{LEVEL_LABEL[level]}</span>;
}
