import Link from 'next/link';
import { Button } from '@/client/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Erro 404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        O endereço acessado não existe ou foi movido. Verifique o link e tente novamente.
      </p>
      <Button asChild>
        <Link href="/dashboard">Voltar ao painel</Link>
      </Button>
    </main>
  );
}
