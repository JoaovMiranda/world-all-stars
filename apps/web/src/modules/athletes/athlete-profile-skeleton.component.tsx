import { Skeleton, SkeletonList } from '@/shared-ui/skeleton.component';

/** Loading shape of the profile (portrait + header, KPIs, tabs, two columns) to avoid layout shift. */
export function AthleteProfileSkeleton() {
  return (
    <div className="page">
      <Skeleton className="mt-4 h-4 w-48" />
      <div className="page-header page-header-media">
        <Skeleton className="aspect-[4/5] w-[168px]" />
        <div className="grid gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="my-5 h-12 w-full" />
      <div className="profile-body">
        <SkeletonList rows={3} className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
