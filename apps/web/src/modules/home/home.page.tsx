import './home.page.css';

import { getRouteApi } from '@tanstack/react-router';

import { useToday } from '@/app/use-boot.hook';
import { homeQuery } from '@/data/endpoints/home.query';
import { useText } from '@/i18n/use-text.hook';
import { ErrorState } from '@/shared-ui/error-state.component';
import { Reveal } from '@/shared-ui/reveal.component';

import { GlobeSection } from './globe-section.component';
import { HallOfGreatsBand } from './hall-of-greats-band.component';
import { homeQueryInput } from './home-query.helper';
import { HomeStage } from './home-stage.component';
import { HOME_MESSAGES } from './home.const';
import { MonthCalendar } from './month-calendar.component';
import { SportsSection } from './sports-section.component';
import { TodayInHistory } from './today-in-history.component';
import { UpcomingList } from './upcoming-list.component';

const route = getRouteApi('/');

/**
 * P1 Home (doc 09): globe → today in history → calendar + next 30 days → Hall of Greats → sports.
 * Sections render their own skeleton while `data` is undefined, so the page never jumps.
 */
export function HomePage() {
  const homeText = useText(HOME_MESSAGES);
  const search = route.useSearch();
  const today = useToday();
  const input = homeQueryInput(search, today);
  const date = input.query.date;
  const home = homeQuery.useQuery(input);
  const data = home.data;

  return (
    <>
      <HomeStage data={data} isError={home.isError} />
      {home.isError ? (
        <ErrorState
          title={homeText.error.title}
          description={homeText.error.text}
          onRetry={() => void home.refetch()}
          isRetrying={home.isFetching}
        />
      ) : (
        <div className="grid home-grid">
          {/* Each section assembles when scrolled into view (once per visit); the wrapper carries the grid span. */}
          <Reveal className="c-12" name="globe">
            <GlobeSection countries={data?.globe} />
          </Reveal>
          <Reveal className="c-12" name="today">
            <TodayInHistory date={date} isSimulatedDate={date !== today} data={data?.todayInHistory} />
          </Reveal>
          <Reveal className="c-8" name="calendar">
            <MonthCalendar key={date} today={date} events={data?.calendar} />
          </Reveal>
          <Reveal className="c-4" name="upcoming">
            <UpcomingList events={data?.upcoming} />
          </Reveal>
          <Reveal className="c-12" name="greats" variant="curtain">
            <HallOfGreatsBand greats={data?.greats} />
          </Reveal>
          <Reveal className="c-12" name="sports">
            <SportsSection sports={data?.sports} />
          </Reveal>
        </div>
      )}
    </>
  );
}
