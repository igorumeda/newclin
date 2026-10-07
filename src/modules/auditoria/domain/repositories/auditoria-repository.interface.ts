import type { AcaoAuditoria, RegistroAuditoria } from '../entities/registro-auditoria.entity';

export type ListarAuditoriaParams = {
  redeId: string;
  usuarioId?: string | null;
  entidade?: string | null;
  entidadeId?: string | null;
  acao?: AcaoAuditoria | null;
  de?: string | null;
  ate?: string | null;
  offset: number;
  limite: number;
};
export type ContarAuditoriaParams = Omit<ListarAuditoriaParams, 'offset' | 'limite'>;

export type RegistrarAcessoProntuarioParams = {
  redeId: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  pacienteId: string;
  atendimentoId?: string | null;
  unidadeId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};
export type ListarAcessosProntuarioParams = {
  redeId: string;
  pacienteId?: string | null;
  limite?: number;
};
export type AcessoProntuarioRegistro = {
  id: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  pacienteId: string;
  pacienteNome: string;
  atendimentoId: string | null;
  ip: string | null;
  criadoEm: string;
};

export interface IAuditoriaRepository {
  registrar(registro: RegistroAuditoria): Promise<void>;
  listar(params: ListarAuditoriaParams): Promise<RegistroAuditoria[]>;
  contar(params: ContarAuditoriaParams): Promise<number>;
  registrarAcessoProntuario(params: RegistrarAcessoProntuarioParams): Promise<void>;
  listarAcessosProntuario(
    params: ListarAcessosProntuarioParams,
  ): Promise<AcessoProntuarioRegistro[]>;
}

export const AUDITORIA_REPOSITORY = Symbol('IAuditoriaRepository');
