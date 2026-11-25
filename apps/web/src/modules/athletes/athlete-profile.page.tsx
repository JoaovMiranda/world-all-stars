import './athlete-profile.css';

import { getRouteApi } from '@tanstack/react-router';
import type { AthleteProfile } from '@was/shared';

import { athleteProfileQuery } from '@/data/endpoints/athletes.query';
import { useText } from '@/i18n/use-text.hook';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';

import { AthleteProfileSkeleton } from './athlete-profile-skeleton.component';
import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { athleteProfileInput } from './athletes-query.helper';
import { profileTemplateFor } from './templates/profile-template.registry';

const route = getRouteApi('/athletes/$slug');

/** Renders the profile with the template of its sport (football, BJJ, boxing, Olympic, chess, Ironman or fallback). */
function ProfileTemplateView({ athlete, slug }: { athlete: AthleteProfile; slug: string }) {
  const Template = profileTemplateFor(athlete);
  return <Template athlete={athlete} slug={slug} />;
}

/** P2 Athlete profile (doc 09): loads the profile and hands it to its sport template (T2.8). */
export function AthleteProfilePage() {
  const t = useText(ATHLETE_PROFILE_MESSAGES);
  const { slug } = route.useParams();
  const profile = athleteProfileQuery.useQuery(athleteProfileInput(slug));
  return (
    <QueryBoundary
      query={profile}
      loading={<AthleteProfileSkeleton />}
      errorTitle={t.errorTitle}
      notFound={
        <PageLayout title={t.notFoundTitle} breadcrumb={[{ label: t.breadcrumb, link: { to: '/athletes' } }, { label: slug }]}>
          <EmptyState title={t.notFoundTitle} mark="?">
            {t.notFoundText}
          </EmptyState>
        </PageLayout>
      }
    >
      {(athlete) => <ProfileTemplateView key={athlete.slug} athlete={athlete} slug={slug} />}
    </QueryBoundary>
  );
}
