import { COMPETITION_LEVEL_ORDER, COMPETITION_LEVEL_WEIGHT, ContactTab, TIER_ORDER } from '@was/shared';

import { ButtonLink } from '@/shared-ui/button-link.component';
import { DocBlocks, DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';
import { LevelTag } from '@/shared-ui/level-tag.component';
import { TierTag } from '@/shared-ui/tier-tag.component';

import { ABOUT_TEXT, CRITERIA_DOC, LEVEL_EXAMPLES, TIER_DEFINITION } from './about.const';

const t = ABOUT_TEXT;

const sections = withSectionExtras(CRITERIA_DOC.sections, {
  criterios: (
    <div className="row">
      <ButtonLink to="/contact" search={{ tipo: ContactTab.Suggestion }} size="sm">
        {t.actions.suggest}
      </ButtonLink>
    </div>
  ),
  niveis: <DocBlocks blocks={[{ kind: 'defs', items: TIER_ORDER.map((tier) => ({ term: <TierTag tier={tier} />, text: TIER_DEFINITION[tier] })) }]} />,
  mitico: (
    <div className="row">
      <ButtonLink to="/hall-of-greats" size="sm" variant="primary">
        {t.actions.hall}
      </ButtonLink>
    </div>
  ),
  campeonatos: (
    <DocBlocks
      blocks={[
        {
          kind: 'table',
          caption: t.levelsCaption,
          headers: t.levelsHeaders,
          rows: COMPETITION_LEVEL_ORDER.map((level) => [<LevelTag key={level} level={level} />, COMPETITION_LEVEL_WEIGHT[level], LEVEL_EXAMPLES[level]]),
        },
      ]}
    />
  ),
  comunidade: (
    <div className="row">
      <ButtonLink to="/athletes" size="sm">
        {t.actions.athletes}
      </ButtonLink>
      <ButtonLink to="/sources" size="sm" variant="link">
        {t.actions.sources}
      </ButtonLink>
    </div>
  ),
});

/** P18 How we choose (docs 00/17): inclusion criteria, tiers, legacy score, Mythic rules and competition levels. */
export function CriteriaPage() {
  return <DocumentPageLayout {...CRITERIA_DOC} updatedAt={t.updatedAt} sections={sections} />;
}
