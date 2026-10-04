import type { User, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { CreateUsuarioParams } from '../../../domain/entities/usuario.entity';

const conviteSchema = z.object({
  rede_id: z.string().uuid(),
  nome: z.string(),
  role: z.enum(['admin_rede', 'gestor_unidade', 'profissional', 'recepcao']),
  unidades_acesso: z.array(z.string().uuid()),
  profissional_id: z.string().uuid().nullable(),
});
type ObterConviteParams = { user: User; serviceClient: SupabaseClient };
type ConvitePendente = { usuarioId?: string; convite: CreateUsuarioParams };

/** Mapeia somente metadados de autorização confiáveis ou o perfil legado. */
export async function obterConvitePendente({
  user,
  serviceClient,
}: ObterConviteParams): Promise<ConvitePendente | null> {
  if (!user.invited_at || !user.email || user.app_metadata.cadastro_concluido === true)
    return null;
  const metadata = conviteSchema.safeParse(user.app_metadata.convite);
  if (metadata.success) {
    const value = metadata.data;
    return {
      convite: {
        redeId: value.rede_id,
        nome: value.nome,
        email: user.email,
        role: value.role,
        unidadesAcesso: value.unidades_acesso,
        profissionalId: value.profissional_id,
      },
    };
  }
  // Convites anteriores à migration 015 já possuem perfil: preserva esse cadastro.
  const { data, error } = await serviceClient
    .from('profiles')
    .select('id, rede_id, nome, role, telefone, unidades_acesso, profissional_id')
    .eq('auth_user_id', user.id)
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error('Não foi possível consultar o convite. Tente novamente.');
  if (!data) return null;
  const legacy = conviteSchema.safeParse(data);
  if (!legacy.success) return null;
  return {
    usuarioId: data.id,
    convite: {
      redeId: legacy.data.rede_id,
      nome: legacy.data.nome,
      email: user.email,
      role: legacy.data.role,
      telefone: data.telefone,
      unidadesAcesso: legacy.data.unidades_acesso,
      profissionalId: legacy.data.profissional_id,
    },
  };
}
