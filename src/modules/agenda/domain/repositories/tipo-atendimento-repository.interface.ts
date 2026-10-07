import type { TipoAtendimento } from '../entities/tipo-atendimento.entity';

export type BuscarTipoAtendimentoParams = { redeId: string; id: string };
export type ListarTiposAtendimentoParams = { redeId: string; apenasAtivos?: boolean };
export type BuscarTipoPorNomeParams = { redeId: string; nome: string; ignorarId?: string | null };

export interface ITipoAtendimentoRepository {
  buscarPorId(params: BuscarTipoAtendimentoParams): Promise<TipoAtendimento | null>;
  buscarPorNome(params: BuscarTipoPorNomeParams): Promise<TipoAtendimento | null>;
  listar(params: ListarTiposAtendimentoParams): Promise<TipoAtendimento[]>;
  salvar(tipo: TipoAtendimento): Promise<void>;
  atualizar(tipo: TipoAtendimento): Promise<void>;
}

export const TIPO_ATENDIMENTO_REPOSITORY = Symbol('ITipoAtendimentoRepository');
