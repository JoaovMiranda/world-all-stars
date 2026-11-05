import './home.page.css';

import { toIsoDate } from '@was/shared';
import { getRouteApi } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';

import { homeQuery } from '@/data/endpoints/home.query';
import { ErrorState } from '@/shared-ui/error-state.component';

import { GlobeSection } from './globe-section.component';
import { HallOfGreatsBand } from './hall-of-greats-band.component';
import { HomeIntro } from './home-intro.component';
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
  const today = useMemo(() => toIsoDate(new Date()), []);
  const date = search.date ?? today;
  const home = homeQuery.useQuery({ query: { date } });
  const data = home.data;

  useEffect(() => {
    document.title = HOME_TEXT.documentTitle;
  }, []);

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
