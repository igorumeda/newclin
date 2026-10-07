import { redirect } from 'next/navigation';
import { lerSessao } from '@/server/bootstrap/session';

export default async function Page() {
  const usuario = await lerSessao();
  redirect(usuario ? '/dashboard' : '/login');
}
