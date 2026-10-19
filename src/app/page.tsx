import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from '@/server/config/env.config';

/**
 * A raiz encaminha para o painel; o `middleware.ts` cuida da autenticação.
 * Sem as credenciais do Supabase, mostra o guia de configuração.
 */
export default function HomePage() {
  redirect(isSupabaseConfigured() ? '/dashboard' : '/configuracao-pendente');
}
