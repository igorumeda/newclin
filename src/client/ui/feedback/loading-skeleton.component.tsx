import { Skeleton } from '@/components/ui/skeleton';

export type LoadingSkeletonProps = { linhas?: number };

export function LoadingSkeleton({ linhas = 5 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: linhas }).map((_, indice) => (
        <Skeleton key={indice} className="h-12 w-full" />
      ))}
    </div>
  );
}
