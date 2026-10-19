import { PageHeader } from '@/client/ui/page-header';
import { Skeleton } from '@/client/ui/feedback';

export type PageLoadingProps = {
  titulo?: string;
};

export function PageLoading({ titulo }: PageLoadingProps) {
  return (
    <section className="min-w-0 space-y-5" aria-busy="true">
      {titulo ? <PageHeader titulo={titulo} /> : <Skeleton className="h-8 w-48 max-w-full" />}
      <p role="status" className="text-sm text-muted-foreground">Carregando conteúdo…</p>
      <div aria-hidden="true" className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </section>
  );
}
