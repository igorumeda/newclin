'use client';

import { useAuth } from '@/client/providers/auth-provider';
import type { AppRole } from '@/modules/user/domain/value-objects/role.vo';

/** Papéis que enxergam prontuário/documentos clínicos (§2.4). */
export const PAPEIS_CLINICOS: AppRole[] = ['admin_rede', 'gestor_unidade', 'profissional'];
export const PAPEIS_GESTAO: AppRole[] = ['admin_rede', 'gestor_unidade'];

/**
 * Atalhos de autorização na interface — espelham as roles permitidas nas rotas.
 * Nunca substituem a verificação do servidor: apenas escondem ações indisponíveis.
 */
export function usePermissoes() {
  const { papel, pode } = useAuth();

  const ehAdmin = papel === 'admin_rede';
  const ehGestao = papel ? PAPEIS_GESTAO.includes(papel as AppRole) : false;
  const ehClinico = papel ? PAPEIS_CLINICOS.includes(papel as AppRole) : false;
  const ehRecepcao = papel === 'recepcao';
  const ehProfissional = papel === 'profissional';

  return {
    papel,
    pode,
    ehAdmin,
    ehGestao,
    ehClinico,
    ehRecepcao,
    ehProfissional,
    /** Recepção não acessa conteúdo clínico (§2.4). */
    podeVerProntuario: ehClinico,
    podeEmitirDocumento: pode('documentos:emitir'),
    podeGerenciarUsuarios: pode('usuarios:gerenciar'),
    podeVerAuditoria: pode('auditoria:ler'),
    podeVerRelatorios: pode('relatorios:ler'),
  };
}
