import { type CalendarEvent, CalendarEventType, eventStart, fromIsoDate } from '@was/shared';

import { useFormat } from '@/i18n/use-format.hook';
import { useText } from '@/i18n/use-text.hook';

import { LevelTag } from './level-tag.component';
import { SportDot } from './sport-dot.component';
import { Tag } from './tag.component';
import { UI_MESSAGES } from './ui-text.const';

interface EventRowProps {
  event: CalendarEvent;
  /** Show level/status badges on the right (lists with room). */
  withBadges?: boolean;
}

/** One calendar entry: date badge + name + sport/period (competition) or ◆ observance with reference. */
export function EventRow({ event, withBadges = false }: EventRowProps) {
  const ui = useText(UI_MESSAGES);
  const fmt = useFormat();
  const date = fromIsoDate(eventStart(event));
  const isCompetition = event.type === CalendarEventType.Competition;
  return (
    <li className={withBadges ? 'event-row has-side' : 'event-row'}>
      <span className="week-date" aria-hidden="true">
        <b>{date.getDate()}</b>
        <span>{fmt.monthShort(date)}</span>
      </span>
      <span className="event-row-main">
        <b className={isCompetition ? 'block' : 'event-obs block'}>
          {!isCompetition && <span aria-hidden="true">◆ </span>}
          {event.name}
          {isCompetition && event.isExample && (
            <>
              {' '}
              <Tag tone="soft">{ui.example}</Tag>
            </>
          )}
        </b>
        <span className="event-row-meta">
          {isCompetition ? (
            <>
              <SportDot colorToken={event.sport.colorToken} />
              {event.sport.name} · {fmt.dateRange(event.start, event.end)}
              {event.host && <span title={event.host.name}> · {event.host.flag}</span>}
            </>
          ) : (
            <>
              {ui.observances} · {fmt.dateRange(event.date, event.date)}
              {event.reference && ` · ${event.reference}`}
            </>
          )}
        </span>
      </span>
      {withBadges && (
        <span className="event-row-side">
          {isCompetition && event.status === 'ongoing' && <span className="live">{ui.live}</span>}
          {isCompetition ? <LevelTag level={event.level} /> : <Tag tone="soft">{ui.observanceScope[event.scope]}</Tag>}
        </span>
      )}
    </li>
  );
}
