import { redirect } from 'next/navigation';
import { AppProviders } from '@/client/providers/app-providers';
import { AppLayout } from '@/client/ui/layout/app-layout.component';
import { carregarContextoAplicacao } from '@/server/bootstrap/app-context';

export type AppAreaLayoutProps = { children: React.ReactNode };

export default async function AppAreaLayout({ children }: AppAreaLayoutProps) {
  const contexto = await carregarContextoAplicacao();
  if (!contexto.usuario) redirect('/login');

  const usuario = {
    id: contexto.usuario.id,
    redeId: contexto.usuario.redeId,
    nome: contexto.usuario.nome,
    email: contexto.usuario.email,
    role: contexto.usuario.role,
    unidadesAcesso: contexto.usuario.unidadesAcesso,
    profissionalId: contexto.usuario.profissionalId,
  };

  return (
    <AppProviders usuario={usuario} coresRede={contexto.rede?.tema.cores ?? null}>
      <AppLayout redeNome={contexto.rede?.nome ?? contexto.appNome} appNome={contexto.appNome}>
        {children}
      </AppLayout>
    </AppProviders>
  );
}
