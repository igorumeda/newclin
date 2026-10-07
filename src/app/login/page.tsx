import { redirect } from 'next/navigation';
import { LoginPage } from '@/modules/auth/client/ui/pages/login.page';
import { AppProviders } from '@/client/providers/app-providers';
import { loadAppConfig } from '@/server/config/env.config';
import { lerSessao } from '@/server/bootstrap/session';

export default async function Page() {
  const usuario = await lerSessao();
  if (usuario) redirect('/dashboard');

  return (
    <AppProviders usuario={null} coresRede={null}>
      <LoginPage appNome={loadAppConfig().name} />
    </AppProviders>
  );
}
