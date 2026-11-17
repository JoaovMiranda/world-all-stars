import './home.page.css';

import { getRouteApi } from '@tanstack/react-router';

import { useToday } from '@/app/use-boot.hook';
import { homeQuery } from '@/data/endpoints/home.query';
import { ErrorState } from '@/shared-ui/error-state.component';

import { GlobeSection } from './globe-section.component';
import { HallOfGreatsBand } from './hall-of-greats-band.component';
import { HomeIntro } from './home-intro.component';
import { homeQueryInput } from './home-query.helper';
import { HOME_TEXT } from './home.const';
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
  const search = route.useSearch();
  const today = useToday();
  const input = homeQueryInput(search, today);
  const date = input.query.date;
  const home = homeQuery.useQuery(input);
  const data = home.data;

  return (
    <>
      <HomeIntro athleteSlugs={data?.athleteSlugs} isError={home.isError} />
      {home.isError ? (
        <ErrorState
          title={HOME_TEXT.error.title}
          description={HOME_TEXT.error.text}
          onRetry={() => void home.refetch()}
          isRetrying={home.isFetching}
        />
      ) : (
        <div className="grid home-grid">
          <GlobeSection countries={data?.globe} />
          <TodayInHistory date={date} isSimulatedDate={date !== today} data={data?.todayInHistory} />
          <MonthCalendar key={date} today={date} events={data?.calendar} />
          <UpcomingList events={data?.upcoming} />
          <HallOfGreatsBand greats={data?.greats} />
          <SportsSection sports={data?.sports} />
        </div>
      )}
    </>
  );
}
