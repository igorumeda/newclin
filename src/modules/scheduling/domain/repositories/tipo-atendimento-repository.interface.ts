import type { TipoAtendimento } from '../entities/tipo-atendimento.entity';

export type ListarTiposAtendimentoFiltro = {
  redeId: string;
  somenteAtivos?: boolean;
  busca?: string | null;
};

export interface ITipoAtendimentoRepository {
  findById(id: string): Promise<TipoAtendimento | null>;
  listar(filtro: ListarTiposAtendimentoFiltro): Promise<TipoAtendimento[]>;
  save(tipo: TipoAtendimento): Promise<void>;
  update(tipo: TipoAtendimento): Promise<void>;
  existsByNome(params: { redeId: string; nome: string; ignorarId?: string | null }): Promise<boolean>;
}

export const TIPO_ATENDIMENTO_REPOSITORY = Symbol('ITipoAtendimentoRepository');
