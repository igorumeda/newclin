import { redirect } from 'next/navigation';

/** A raiz encaminha para o painel; o middleware cuida da autenticação. */
export default function HomePage() {
  redirect('/dashboard');
}
