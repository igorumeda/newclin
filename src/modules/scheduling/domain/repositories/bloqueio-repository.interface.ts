import type { BloqueioAgenda } from '../entities/bloqueio-agenda.entity';

export type ListarBloqueiosFiltro = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  de: string;
  ate: string;
  somenteAtivos?: boolean;
};

export interface IBloqueioAgendaRepository {
  findById(id: string): Promise<BloqueioAgenda | null>;
  listar(filtro: ListarBloqueiosFiltro): Promise<BloqueioAgenda[]>;
  save(bloqueio: BloqueioAgenda): Promise<void>;
  update(bloqueio: BloqueioAgenda): Promise<void>;
}

export const BLOQUEIO_AGENDA_REPOSITORY = Symbol('IBloqueioAgendaRepository');
