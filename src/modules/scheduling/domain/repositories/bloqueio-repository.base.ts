import type { BloqueioAgenda } from '../entities/bloqueio-agenda.entity';
import type {
  IBloqueioAgendaRepository,
  ListarBloqueiosFiltro,
} from './bloqueio-repository.interface';

export abstract class BloqueioAgendaRepository implements IBloqueioAgendaRepository {
  abstract findById(id: string): Promise<BloqueioAgenda | null>;
  abstract listar(filtro: ListarBloqueiosFiltro): Promise<BloqueioAgenda[]>;
  abstract save(bloqueio: BloqueioAgenda): Promise<void>;
  abstract update(bloqueio: BloqueioAgenda): Promise<void>;
}
