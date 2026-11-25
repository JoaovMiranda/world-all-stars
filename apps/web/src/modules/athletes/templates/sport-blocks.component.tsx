import type { ReactNode } from 'react';

import { AthleteRankings } from '../athlete-rankings.component';

interface SportBlocksProps {
  athleteSlug: string;
  /** Sport panel resolved from the stats schema (football, swimming, boxing, cs or generic). */
  panel: ReactNode;
  /** Sport-specific block shown before everything else (BJJ classes, Olympic medals). */
  lead?: ReactNode;
  /** Methodology positions before the panel (boxing designation, chess) instead of after it. */
  rankingsFirst?: boolean;
  /** "Titles" section (T4.3): titles and medals by competition, after the sport panel and rankings. */
  titles?: ReactNode;
}

/** Sport-specific part of the Overview tab of a template: lead block, sport panel, the athlete's rankings and titles. */
export function SportBlocks({ athleteSlug, panel, lead, rankingsFirst = false, titles }: SportBlocksProps) {
  const rankings = <AthleteRankings athleteSlug={athleteSlug} />;
  return (
    <>
      {lead}
      {rankingsFirst && rankings}
      {panel}
      {!rankingsFirst && rankings}
      {titles}
    </>
  );
}
