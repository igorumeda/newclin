import type { BloqueioAgenda } from '../entities/bloqueio-agenda.entity';

export type ListarBloqueiosParams = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  inicio: string;
  fim: string;
};
export type RemoverBloqueioParams = { redeId: string; id: string };
export type BuscarBloqueioParams = { redeId: string; id: string };

export interface IBloqueioAgendaRepository {
  buscarPorId(params: BuscarBloqueioParams): Promise<BloqueioAgenda | null>;
  listar(params: ListarBloqueiosParams): Promise<BloqueioAgenda[]>;
  salvar(bloqueio: BloqueioAgenda): Promise<void>;
  remover(params: RemoverBloqueioParams): Promise<void>;
}

export const BLOQUEIO_AGENDA_REPOSITORY = Symbol('IBloqueioAgendaRepository');
