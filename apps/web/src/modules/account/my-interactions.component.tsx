import type { MyInteractionItem } from '@was/shared';

import { clearStar, myInteractionsQuery, toggleHeart } from '@/data/endpoints/interactions.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { formatDate, formatNumber } from '@/shared-ui/format.helper';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { ACCOUNT_INTERACTIONS_MESSAGES } from './account-interactions.const';
import { AthleteChip } from './athlete-chip.component';

interface InteractionRowProps {
  item: MyInteractionItem;
  removeLabel: string;
  pending: boolean;
  onRemove: () => void;
}

function InteractionRow({ item, removeLabel, pending, onRemove }: InteractionRowProps) {
  const t = useText(ACCOUNT_INTERACTIONS_MESSAGES);
  return (
    <li className="account-item">
      <AthleteChip athlete={item.athlete} />
      <div className="account-item-body">
        <span className="account-item-meta">{t.since(formatDate(item.at.slice(0, 10)))}</span>
      </div>
      <div className="account-item-actions">
        <Button size="sm" variant="link" pending={pending} aria-label={removeLabel} onClick={onRemove}>
          {t.remove}
        </Button>
      </div>
    </li>
  );
}

/** "My star and hearts" (D02/D03): the owner's private list (the API answers it to the owner only). */
export function MyInteractions() {
  const t = useText(ACCOUNT_INTERACTIONS_MESSAGES);
  const mine = myInteractionsQuery.useQuery();
  const unstar = clearStar.useMutation();
  const unheart = toggleHeart.useMutation();
  return (
    <QueryBoundary query={mine} loading={<SkeletonList rows={3} />}>
      {({ star, hearts }) => (
        <>
          <Section title={t.starTitle}>
            <p className="muted mb-3 text-sm">{t.starHint}</p>
            {star ? (
              <ul className="account-list">
                <InteractionRow
                  item={star}
                  removeLabel={t.removeStar(star.athlete.knownAs)}
                  pending={unstar.isPending}
                  onRemove={() => unstar.mutate({ params: { slug: star.athlete.slug } })}
                />
              </ul>
            ) : (
              <EmptyState compact title={t.noStarTitle} action={<ButtonLink to="/athletes">{t.browseAthletes}</ButtonLink>}>
                {t.noStarText}
              </EmptyState>
            )}
          </Section>
          <Section title={t.heartsTitle} eyebrow={formatNumber(hearts.length)}>
            {hearts.length ? (
              <ul className="account-list">
                {hearts.map((h) => (
                  <InteractionRow
                    key={h.athlete.slug}
                    item={h}
                    removeLabel={t.removeHeart(h.athlete.knownAs)}
                    pending={unheart.isPending && unheart.variables?.params.slug === h.athlete.slug}
                    onRemove={() => unheart.mutate({ params: { slug: h.athlete.slug }, body: { hearted: false } })}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState compact title={t.noHeartsTitle} action={<ButtonLink to="/athletes">{t.browseAthletes}</ButtonLink>}>
                {t.noHeartsText}
              </EmptyState>
            )}
          </Section>
        </>
      )}
    </QueryBoundary>
  );
}
