import type { Unidade } from '../entities/unidade.entity';

export type UnidadeId = string;
export type BuscarUnidadeParams = { redeId: string; id: UnidadeId };
export type ListarUnidadesParams = { redeId: string; busca?: string; apenasAtivas?: boolean };

export interface IUnidadeRepository {
  buscarPorId(params: BuscarUnidadeParams): Promise<Unidade | null>;
  listar(params: ListarUnidadesParams): Promise<Unidade[]>;
  salvar(unidade: Unidade): Promise<void>;
  atualizar(unidade: Unidade): Promise<void>;
}

export const UNIDADE_REPOSITORY = Symbol('IUnidadeRepository');
