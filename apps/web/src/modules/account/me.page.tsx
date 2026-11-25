import { AthleteProfileTab, type MeResponse } from '@was/shared';

import { meQuery } from '@/data/endpoints/session.query';
import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { formatDate, formatNumber } from '@/shared-ui/format.helper';
import { KpiGrid } from '@/shared-ui/kpi-grid.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { Skeleton, SkeletonList } from '@/shared-ui/skeleton.component';
import { StatTile } from '@/shared-ui/stat-tile.component';
import { Tag } from '@/shared-ui/tag.component';
import { TierTag } from '@/shared-ui/tier-tag.component';

import { AccountLayout } from './account-layout.component';
import { ACCOUNT_MESSAGES } from './account.const';
import { AthleteChip } from './athlete-chip.component';
import { MyInteractions } from './my-interactions.component';

type Vote = MeResponse['votes'][number];

const VOTE_COLUMNS = () => {
  const t = currentText(ACCOUNT_MESSAGES).me;
  return [
    { key: 'athlete', header: t.colAthlete, cell: (v: Vote) => <AthleteChip athlete={v.athlete} />, sortValue: (v: Vote) => v.athlete.knownAs },
    {
      key: 'vote',
      header: t.colMyVote,
      cell: (v: Vote) => (
        <span className="row">
          <TierTag tier={v.tier} />
          {v.tier === v.athlete.tier && <Tag tone="soft">{t.agrees}</Tag>}
        </span>
      ),
    },
    { key: 'official', header: t.colOfficial, cell: (v: Vote) => <TierTag tier={v.athlete.tier} /> },
    { key: 'at', header: t.colDate, cell: (v: Vote) => formatDate(v.at.slice(0, 10)), sortValue: (v: Vote) => v.at, align: 'end' as const },
  ];
};

function MeContent() {
  const t = useText(ACCOUNT_MESSAGES).me;
  const me = meQuery.useQuery();
  return (
    <QueryBoundary
      query={me}
      loading={
        <div className="stack">
          <Skeleton className="h-28 w-full" />
          <SkeletonList rows={5} />
        </div>
      }
    >
      {({ votes, comments }) => (
        <>
          <KpiGrid columns={3} label={t.kpis}>
            <StatTile label={t.votesKpi} value={votes.length} />
            <StatTile label={t.commentsKpi} value={comments.filter((c) => !c.isReply).length} />
            <StatTile label={t.repliesKpi} value={comments.filter((c) => c.isReply).length} />
          </KpiGrid>
          <Section title={t.votesTitle} eyebrow={formatNumber(votes.length)}>
            {votes.length ? (
              <>
                <p className="muted mb-3 text-sm">{t.votesHint}</p>
                <DataTable columns={VOTE_COLUMNS()} rows={votes} rowKey={(v) => v.athlete.slug} caption={t.votesCaption} captionHidden initialSort={{ key: 'at', dir: 'desc' }} />
              </>
            ) : (
              <EmptyState compact title={t.noVotesTitle} action={<ButtonLink to="/athletes">{t.browseAthletes}</ButtonLink>}>
                {t.noVotesText}
              </EmptyState>
            )}
          </Section>
          <Section title={t.commentsTitle} eyebrow={formatNumber(comments.length)}>
            {comments.length ? (
              <ul className="account-list">
                {comments.map((c) => (
                  <li key={c.id} className="account-item">
                    <AthleteChip athlete={c.athlete} />
                    <div className="account-item-body">
                      <p>{c.body}</p>
                      <span className="account-item-meta">
                        {formatDate(c.at.slice(0, 10))}
                        {c.isReply && ` · ${t.reply}`}
                      </span>
                    </div>
                    <div className="account-item-actions">
                      <ButtonLink to="/athletes/$slug" params={{ slug: c.athlete.slug }} search={{ tab: AthleteProfileTab.Comments }} size="sm" variant="link" aria-label={t.seeOnProfile(c.athlete.knownAs)}>
                        {t.seeComment}
                      </ButtonLink>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title={t.noCommentsTitle} action={<ButtonLink to="/athletes">{t.browseAthletes}</ButtonLink>}>
                {t.noCommentsText}
              </EmptyState>
            )}
          </Section>
        </>
      )}
    </QueryBoundary>
  );
}

/** E2 My profile (docs 09/17/20): tier votes given, comments written, and my star and hearts (D02). */
export function MePage() {
  const t = useText(ACCOUNT_MESSAGES).me;
  return (
    <AccountLayout title={t.title} lead={t.lead}>
      <MeContent />
      <MyInteractions />
    </AccountLayout>
  );
}
