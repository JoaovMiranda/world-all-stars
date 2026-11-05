import { cx } from './class-names.helper';

interface SkeletonProps {
  className?: string;
}

/** Placeholder block with the final size of the content (prevents layout shift while loading). */
export function Skeleton({ className }: SkeletonProps) {
  return <span className={cx('skeleton', className)} aria-hidden="true" />;
}

/** N stacked skeleton rows (default loading UI of QueryBoundary). */
export function SkeletonList({ rows = 4, className = 'h-12 w-full' }: { rows?: number; className?: string }) {
  return (
    <div className="grid grid-cols-1 gap-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}
