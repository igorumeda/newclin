import type { SupabaseClient } from '@supabase/supabase-js';

export type RegistraAcessoParams = {
  supabase: SupabaseClient;
  usuarioId: string;
};

/**
 * Atualiza `profiles.ultimo_acesso_em`. A RLS permite que o próprio usuário
 * atualize o seu registro — falhas aqui nunca impedem o login.
 */
export async function registraAcesso(params: RegistraAcessoParams): Promise<void> {
  try {
    await params.supabase
      .from('profiles')
      .update({ ultimo_acesso_em: new Date().toISOString() })
      .eq('id', params.usuarioId);
  } catch {
    // Telemetria de acesso é best-effort.
  }
}
