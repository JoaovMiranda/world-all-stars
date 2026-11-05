import { type CalendarEvent, CalendarEventType, type IsoDate, eventKey, eventsOnDay, fromIsoDate } from '@was/shared';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo, useState } from 'react';

import { Button } from '@/shared-ui/button.component';
import { Chip } from '@/shared-ui/chip.component';
import { EventList } from '@/shared-ui/event-list.component';
import { capitalize, tokenColor } from '@/shared-ui/format.helper';
import { Notice } from '@/shared-ui/notice.component';
import { UI_TEXT } from '@/shared-ui/ui-text.const';

import { buildMonthGrid } from './calendar.helper';
import { HOME_TEXT } from './home.const';
import { useMonthCalendar } from './use-month-calendar.hook';

interface MonthCalendarProps {
  today: IsoDate;
  /** undefined while loading (the grid still renders, without events). */
  events: CalendarEvent[] | undefined;
}

const t = HOME_TEXT.calendar;

/** Month grid (Monday first) with competitions as sport-colored bars and observances as ◆. */
export function MonthCalendar({ today, events }: MonthCalendarProps) {
  const { month, selected, goToMonth, goToToday, selectDay } = useMonthCalendar(today);
  const [hiddenSports, setHiddenSports] = useState<ReadonlySet<string>>(new Set());
  const [showObservances, setShowObservances] = useState(true);

  const all = events ?? [];
  const sports = useMemo(
    () => [...new Map(all.flatMap((e) => (e.type === CalendarEventType.Competition ? [[e.sport.slug, e.sport] as const] : []))).values()],
    [all],
  );
  const visible = all.filter((e) =>
    e.type === CalendarEventType.Competition ? !hiddenSports.has(e.sport.slug) : showObservances,
  );
  const cells = useMemo(() => buildMonthGrid(month), [month]);
  const dayEvents = eventsOnDay(visible, selected);
  const hasExamples = all.some((e) => e.type === CalendarEventType.Competition && e.isExample);

  const toggleSport = (slug: string) =>
    setHiddenSports((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (sports.length - next.size > 1) next.add(slug);
      return next;
    });

  return (
    <section className="card c-8" id="calendario" aria-labelledby="cal-title" aria-busy={!events}>
      <div className="card-head">
        <h2 id="cal-title">{t.title}</h2>
        {hasExamples && <span className="label">{t.exampleHint}</span>}
      </div>

      <div className="cal-toolbar">
        <div className="row">
          <Button size="icon" aria-label={t.prevMonth} onClick={() => goToMonth(-1)}>
            ‹
          </Button>
          <h3 className="cal-title" aria-live="polite">
            {capitalize(format(month, 'MMMM yyyy', { locale: ptBR }))}
          </h3>
          <Button size="icon" aria-label={t.nextMonth} onClick={() => goToMonth(1)}>
            ›
          </Button>
          <Button variant="ghost" onClick={goToToday}>
            {t.today}
          </Button>
        </div>
        {all.length > 0 && (
          <div className="row cal-filters" role="group" aria-label={t.filters}>
            {sports.map((s) => (
              <Chip key={s.slug} toggle pressed={!hiddenSports.has(s.slug)} swatch={s.colorToken} onClick={() => toggleSport(s.slug)}>
                {s.name}
              </Chip>
            ))}
            <Chip toggle pressed={showObservances} onClick={() => setShowObservances((v) => !v)}>
              <span className="mr-1.5 text-(--accent-text)" aria-hidden="true">◆</span>
              {UI_TEXT.observances}
            </Chip>
          </div>
        )}
      </div>

      {events && all.length === 0 && (
        <Notice className="mb-3">{t.emptyNotice}</Notice>
      )}

      <div className="cal-grid">
        {t.weekdays.map((d) => (
          <div key={d} className="cal-dow label" aria-hidden="true">
            {d}
          </div>
        ))}
        {cells.map((cell) => {
          const evs = cell.inMonth ? eventsOnDay(visible, cell.iso) : [];
          const classes = ['cal-cell', !cell.inMonth && 'out', cell.iso === today && 'today', cell.iso === selected && 'sel'].filter(Boolean).join(' ');
          return (
            <button
              key={cell.iso}
              type="button"
              className={classes}
              tabIndex={cell.inMonth ? 0 : -1}
              aria-hidden={cell.inMonth ? undefined : true}
              aria-pressed={cell.iso === selected}
              aria-current={cell.iso === today ? 'date' : undefined}
              onClick={() => cell.inMonth && selectDay(cell.date)}
            >
              <span className="n">
                {cell.date.getDate()}
                <span className="sr-only">
                  {' '}
                  de {format(cell.date, 'MMMM', { locale: ptBR })}: {t.events(evs.length)}
                </span>
              </span>
              {evs.map((e) =>
                e.type === CalendarEventType.Competition ? (
                  <span
                    key={eventKey(e)}
                    className={e.isExample ? 'ev ex' : 'ev'}
                    style={{ background: tokenColor(e.sport.colorToken), color: tokenColor(`on-${e.sport.colorToken}`) }}
                    title={e.name}
                  >
                    {cell.iso === e.start || cell.date.getDay() === 1 ? e.name : ' '}
                  </span>
                ) : (
                  <span key={eventKey(e)} className="obs" title={e.name}>
                    ◆ {e.name}
                  </span>
                ),
              )}
            </button>
          );
        })}
      </div>

      <div className="cal-day" aria-live="polite">
        <span className="label">{format(fromIsoDate(selected), "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
        {dayEvents.length > 0 ? <EventList events={dayEvents} emptyTitle={t.emptyDay} /> : <p className="empty">{t.emptyDay}</p>}
      </div>
    </section>
  );
}
