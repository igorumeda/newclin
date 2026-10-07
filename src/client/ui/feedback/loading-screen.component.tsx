import { Loader2 } from 'lucide-react';

export type LoadingScreenProps = { mensagem?: string };

export function LoadingScreen({ mensagem = 'Carregando…' }: LoadingScreenProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <p className="text-sm">{mensagem}</p>
    </div>
  );
}
