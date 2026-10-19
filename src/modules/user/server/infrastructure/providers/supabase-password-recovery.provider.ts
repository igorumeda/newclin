import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/server/config/env.config';
import { isSupabaseConfigured } from '@/server/config/env.config';
import { SupabaseNotConfiguredError } from '@/server/config/supabase.config';
type EnviarRecuperacaoParams = { email: string };

/** O fluxo implícito permite abrir o e-mail em outro navegador ou dispositivo. */
export async function enviarRecuperacao(params: EnviarRecuperacaoParams) {
  if (!isSupabaseConfigured()) throw new SupabaseNotConfiguredError();
  const env = getEnv();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  return supabase.auth.resetPasswordForEmail(params.email, {
    redirectTo: new URL('/redefinir-senha', env.NEXT_PUBLIC_APP_URL).toString(),
  });
}
