import { type CalendarEvent, CalendarEventType, eventStart, fromIsoDate } from '@was/shared';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { formatDateRange } from './format.helper';
import { LevelTag } from './level-tag.component';
import { SportDot } from './sport-dot.component';
import { Tag } from './tag.component';
import { UI_TEXT } from './ui-text.const';

interface EventRowProps {
  event: CalendarEvent;
  /** Show level/status badges on the right (lists with room). */
  withBadges?: boolean;
}

/** One calendar entry: date badge + name + sport/period (competition) or ◆ observance with reference. */
export function EventRow({ event, withBadges = false }: EventRowProps) {
  const date = fromIsoDate(eventStart(event));
  const isCompetition = event.type === CalendarEventType.Competition;
  return (
    <li className={withBadges ? 'event-row has-side' : 'event-row'}>
      <span className="week-date" aria-hidden="true">
        <b>{format(date, 'd')}</b>
        <span>{format(date, 'MMM', { locale: ptBR })}</span>
      </span>
      <span className="event-row-main">
        <b className={isCompetition ? 'block' : 'event-obs block'}>
          {!isCompetition && <span aria-hidden="true">◆ </span>}
          {event.name}
          {isCompetition && event.isExample && (
            <>
              {' '}
              <Tag tone="soft">{UI_TEXT.example}</Tag>
            </>
          )}
        </b>
        <span className="event-row-meta">
          {isCompetition ? (
            <>
              <SportDot colorToken={event.sport.colorToken} />
              {event.sport.name} · {formatDateRange(event.start, event.end)}
              {event.host && <span title={event.host.name}> · {event.host.flag}</span>}
            </>
          ) : (
            <>
              {UI_TEXT.observances} · {formatDateRange(event.date, event.date)}
              {event.reference && ` · ${event.reference}`}
            </>
          )}
        </span>
      </span>
      {withBadges && (
        <span className="event-row-side">
          {isCompetition && event.status === 'ongoing' && <span className="live">{UI_TEXT.live}</span>}
          {isCompetition ? <LevelTag level={event.level} /> : <Tag tone="soft">{UI_TEXT.observanceScope[event.scope]}</Tag>}
        </span>
      )}
    </li>
  );
}
