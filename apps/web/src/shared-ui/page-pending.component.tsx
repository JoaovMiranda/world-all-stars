import { useText } from '@/i18n/use-text.hook';

import { Skeleton, SkeletonList } from './skeleton.component';
import { UI_MESSAGES } from './ui-text.const';

/**
 * Router `defaultPendingComponent`: shown when a navigation's loader (page chunk + data) takes longer than
 * `defaultPendingMs`, so a slow network never leaves the old page frozen with no feedback. Same frame as PageLayout.
 */
export function PagePending() {
  const ui = useText(UI_MESSAGES);
  return (
    <div className="page" aria-busy="true">
      <p className="sr-only" role="status">
        {ui.loadingLabel}
      </p>
      <div className="stack">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="stack mt-8">
        <SkeletonList rows={5} className="h-20 w-full" />
      </div>
    </div>
  );
}
