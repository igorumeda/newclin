import type { Rede } from '../entities/rede.entity';

export type RedeId = string;
export type BuscarRedeParams = { id: RedeId };
export type BuscarRedePorSlugParams = { slug: string };

export interface IRedeRepository {
  buscarPorId(params: BuscarRedeParams): Promise<Rede | null>;
  buscarPorSlug(params: BuscarRedePorSlugParams): Promise<Rede | null>;
  salvar(rede: Rede): Promise<void>;
  atualizar(rede: Rede): Promise<void>;
}

export const REDE_REPOSITORY = Symbol('IRedeRepository');
