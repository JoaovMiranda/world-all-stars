import { type CalendarEvent, CalendarEventType, type IsoDate, eventKey, eventsOnDay, fromIsoDate } from '@was/shared';
import { addDays, addMonths, endOfWeek, startOfWeek } from 'date-fns';
import { type CSSProperties, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

import { useFormat } from '@/i18n/use-format.hook';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { Chip } from '@/shared-ui/chip.component';
import { EventList } from '@/shared-ui/event-list.component';
import { capitalize, tokenColor } from '@/shared-ui/format.helper';
import { Notice } from '@/shared-ui/notice.component';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';

import { buildMonthGrid } from './calendar.helper';
import { HOME_MESSAGES } from './home.const';
import { useMonthCalendar } from './use-month-calendar.hook';

interface MonthCalendarProps {
  today: IsoDate;
  /** undefined while loading (the grid still renders, without events). */
  events: CalendarEvent[] | undefined;
}

/** Hick: sport chips shown before "+ N esportes" (busiest of the month first). */
const CAL_CHIPS_VISIBLE = 5;

type CalendarSport = NonNullable<Extract<CalendarEvent, { sport: unknown }>['sport']>;

/** Month grid (Monday first) with competitions as sport-colored bars and observances as ◆. */
export function MonthCalendar({ today, events }: MonthCalendarProps) {
  const t = useText(HOME_MESSAGES).calendar;
  const ui = useText(UI_MESSAGES);
  const fmt = useFormat();
  const { month, selected, goToMonth, goToToday, selectDay } = useMonthCalendar(today);
  const [hiddenSports, setHiddenSports] = useState<ReadonlySet<string>>(new Set());
  const [showObservances, setShowObservances] = useState(true);

  const all = events ?? [];
  // Hick: busiest sports of the month first; only CAL_CHIPS_VISIBLE chips until the user asks for the rest.
  const sports = useMemo(() => {
    const bySlug = new Map<string, { sport: CalendarSport; n: number }>();
    for (const e of all) {
      if (e.type !== CalendarEventType.Competition) continue;
      const entry = bySlug.get(e.sport.slug) ?? { sport: e.sport, n: 0 };
      entry.n += 1;
      bySlug.set(e.sport.slug, entry);
    }
    return [...bySlug.values()].sort((a, b) => b.n - a.n).map((x) => x.sport);
  }, [all]);
  const [showAllSports, setShowAllSports] = useState(false);
  const overflow = sports.length - CAL_CHIPS_VISIBLE;
  const chipSports = showAllSports || overflow <= 1 ? sports : sports.filter((s, i) => i < CAL_CHIPS_VISIBLE || hiddenSports.has(s.slug));
  const visible = all.filter((e) =>
    e.type === CalendarEventType.Competition ? !hiddenSports.has(e.sport.slug) : showObservances,
  );
  const cells = useMemo(() => buildMonthGrid(month), [month]);
  const dayEvents = eventsOnDay(visible, selected);
  const hasExamples = all.some((e) => e.type === CalendarEventType.Competition && e.isExample);

  // Roving tabindex (APG date grid): one Tab stop on the selected day; arrows, Home/End and Page Up/Down move it.
  const gridRef = useRef<HTMLDivElement>(null);
  const focusAfterMove = useRef(false);
  useEffect(() => {
    if (!focusAfterMove.current) return;
    focusAfterMove.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${selected}"]`)?.focus();
  }, [selected, month]);
  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const day = fromIsoDate(selected);
    const weekStartsOn = 1;
    const next = {
      ArrowLeft: () => addDays(day, -1),
      ArrowRight: () => addDays(day, 1),
      ArrowUp: () => addDays(day, -7),
      ArrowDown: () => addDays(day, 7),
      Home: () => startOfWeek(day, { weekStartsOn }),
      End: () => endOfWeek(day, { weekStartsOn }),
      PageUp: () => addMonths(day, -1),
      PageDown: () => addMonths(day, 1),
    }[e.key];
    if (!next) return;
    e.preventDefault();
    focusAfterMove.current = true;
    selectDay(next());
  };

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
            {capitalize(fmt.monthYear(month))}
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
            {chipSports.map((s) => (
              <Chip key={s.slug} toggle pressed={!hiddenSports.has(s.slug)} swatch={s.colorToken} onClick={() => toggleSport(s.slug)}>
                {s.name}
              </Chip>
            ))}
            {overflow > 1 && (
              <Chip className="chip-more" aria-expanded={showAllSports} onClick={() => setShowAllSports((v) => !v)}>
                {showAllSports ? t.fewerSports : t.moreSports(sports.length - chipSports.length)}
              </Chip>
            )}
            <Chip toggle pressed={showObservances} onClick={() => setShowObservances((v) => !v)}>
              <span className="mr-1.5 text-(--accent-text)" aria-hidden="true">◆</span>
              {ui.observances}
            </Chip>
          </div>
        )}
      </div>

      {events && all.length === 0 && (
        <Notice className="mb-3">{t.emptyNotice}</Notice>
      )}

      <p id="cal-grid-hint" className="sr-only">{t.gridHint}</p>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- keydown only routes arrow keys to the day buttons */}
      <div className="cal-grid" ref={gridRef} role="group" aria-labelledby="cal-title" aria-describedby="cal-grid-hint" onKeyDown={onGridKeyDown}>
        {t.weekdays.map((d) => (
          <div key={d} className="cal-dow label" aria-hidden="true">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const evs = cell.inMonth ? eventsOnDay(visible, cell.iso) : [];
          const classes = ['cal-cell', !cell.inMonth && 'out', cell.iso === today && 'today', cell.iso === selected && 'sel'].filter(Boolean).join(' ');
          return (
            <button
              key={cell.iso}
              type="button"
              className={classes}
              // Diagonal cascade when the calendar scrolls in: row + column.
              style={{ '--cd': Math.floor(i / 7) + (i % 7) } as CSSProperties}
              data-iso={cell.iso}
              tabIndex={cell.iso === selected ? 0 : -1}
              aria-hidden={cell.inMonth ? undefined : true}
              aria-pressed={cell.iso === selected}
              aria-current={cell.iso === today ? 'date' : undefined}
              onClick={() => cell.inMonth && selectDay(cell.date)}
            >
              <span className="n">
                {cell.date.getDate()}
                <span className="sr-only">{t.cellSuffix(fmt.month(cell.date), t.events(evs.length))}</span>
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
                    {e.isExample && <span className="sr-only">{t.exampleSuffix}</span>}
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

      {/* Not a live region: the focused day button already announces its date and event count. */}
      <div className="cal-day">
        <span className="label">{fmt.weekdayDayMonth(fromIsoDate(selected))}</span>
        {dayEvents.length > 0 ? <EventList events={dayEvents} emptyTitle={t.emptyDay} /> : <p className="empty">{t.emptyDay}</p>}
      </div>
    </section>
  );
}
