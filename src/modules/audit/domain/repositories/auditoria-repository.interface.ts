import type { Auditoria } from '../entities/auditoria.entity';

export type AuditoriaId = string;

export type ListarAuditoriaFiltro = {
  redeId: string;
  entidade?: string | null;
  acao?: string | null;
  usuarioId?: string | null;
  registroId?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  page: number;
  perPage: number;
};

export type ListarAuditoriaResultado = {
  items: Auditoria[];
  total: number;
};

export interface IAuditoriaRepository {
  registrar(auditoria: Auditoria): Promise<void>;
  listar(filtro: ListarAuditoriaFiltro): Promise<ListarAuditoriaResultado>;
  listarPorRegistro(params: { redeId: string; entidade: string; registroId: string }): Promise<Auditoria[]>;
}

export const AUDITORIA_REPOSITORY = Symbol('IAuditoriaRepository');
