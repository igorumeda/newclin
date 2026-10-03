import type { Unidade } from '../entities/unidade.entity';

export type UnidadeId = string;

export type ListarUnidadesFiltro = {
  redeId: string;
  unidadeIdsRestritas?: string[];
  busca?: string | null;
  ativo?: boolean | null;
};

export interface IUnidadeRepository {
  findById(id: UnidadeId): Promise<Unidade | null>;
  listar(filtro: ListarUnidadesFiltro): Promise<Unidade[]>;
  save(unidade: Unidade): Promise<void>;
  update(unidade: Unidade): Promise<void>;
  existsByNome(params: { redeId: string; nome: string; ignorarId?: string }): Promise<boolean>;
  existsByCnes(params: { redeId: string; cnes: string; ignorarId?: string }): Promise<boolean>;
}

export const UNIDADE_REPOSITORY = Symbol('IUnidadeRepository');
