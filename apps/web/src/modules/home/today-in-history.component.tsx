import { type HomeResponse, type IsoDate } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';
import { Avatar } from '@/shared-ui/avatar.component';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { formatDayMonth } from '@/shared-ui/format.helper';
import { Section } from '@/shared-ui/section.component';
import { Skeleton, SkeletonList } from '@/shared-ui/skeleton.component';

import { HOME_MESSAGES } from './home.const';

interface TodayInHistoryProps {
  date: IsoDate;
  isSimulatedDate: boolean;
  data: HomeResponse['todayInHistory'] | undefined;
}

function ObservanceBox({ data }: { data: HomeResponse['todayInHistory'] }) {
  const t = useText(HOME_MESSAGES).today;
  const today = data.observance;
  const next = data.nextObservance;
  if (!today && !next) return <p className="observance observance-empty">{t.noObservance}</p>;
  const shown = today ?? next;
  return (
    <div className="observance">
      <span className="mark" aria-hidden="true">
        ◆
      </span>
      <div>
        <b>{today ? t.observanceToday : `${t.observanceNext}: ${next ? formatDayMonth(next.date) : ''}`}</b> · {shown?.name}{' '}
        {shown?.reference && <span className="muted">({shown.reference})</span>}
      </div>
    </div>
  );
}

export function TodayInHistory({ date, isSimulatedDate, data }: TodayInHistoryProps) {
  const t = useText(HOME_MESSAGES).today;
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  return (
    <Section
      variant="gold"
      span={12}
      title={<span className="label label-gold">{t.label}</span>}
      actions={
        isSimulatedDate && (
          <Link className="label" to="/" search={{}}>
            {t.backToToday}
          </Link>
        )
      }
    >
      <div className="otd-layout">
        <div>
          <div className="otd-date">
            <Link className="date-link" to="/on-this-day/$md" params={{ md: date.slice(5) }}>
              {formatDayMonth(date)}
            </Link>
          </div>
          {data ? <ObservanceBox data={data} /> : <Skeleton className="mt-3 h-11 w-full" />}
        </div>
        {!data ? (
          <SkeletonList rows={4} />
        ) : data.items.length === 0 ? (
          <EmptyState title={`${t.emptyTitle} (${formatDayMonth(date)})`} compact>
            <p>{t.emptyText}</p>
          </EmptyState>
        ) : (
          <ul className="otd-list">
            {data.items.map((item) => (
              <li key={`${item.athlete.slug}-${item.kind}-${item.year}`} className="otd-item">
                <Avatar name={item.athlete.knownAs} tier={item.athlete.tier} photoUrl={item.athlete.photo?.url ?? null} size={36} />
                <span className="min-w-0">
                  <Link to="/athletes/$slug" params={{ slug: item.athlete.slug }}>
                    <b>{item.athlete.knownAs}</b>
                  </Link>
                  <small>
                    {labels.onThisDayKind[item.kind]} · {item.title}
                  </small>
                </span>
                <span className="otd-year">{item.year}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
