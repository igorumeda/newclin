import type { SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/server/config/env.config';
import type {
  ILogAcessoProntuario,
  RegistrarAcessoProntuario,
} from '../../../domain/services/log-acesso-prontuario.interface';

export type LogAcessoProntuarioProviderDependencies = {
  supabase: SupabaseClient;
};

/**
 * Log de leitura de prontuário (LGPD §5).
 * Chama a função `registrar_acesso_prontuario`, que grava a entrada na trilha de
 * auditoria. Falhas de gravação nunca interrompem a leitura clínica — apenas são
 * registradas no console do servidor. Desativável por `AUDIT_LOG_READS=false`.
 */
export class LogAcessoProntuarioProvider implements ILogAcessoProntuario {
  private readonly supabase: SupabaseClient;
  private readonly habilitado: boolean;

  constructor(dependencies: LogAcessoProntuarioProviderDependencies) {
    this.supabase = dependencies.supabase;
    this.habilitado = getEnv().AUDIT_LOG_READS;
  }

  public readonly registrar: RegistrarAcessoProntuario = async (params) => {
    if (!this.habilitado) return;

    const { error } = await this.supabase.rpc('registrar_acesso_prontuario', {
      p_paciente_id: params.pacienteId,
      p_atendimento_id: params.atendimentoId,
      p_unidade_id: params.unidadeId,
    });

    if (error) {
      console.warn('[auditoria] Falha ao registrar acesso ao prontuário:', error.message);
    }
  };
}
