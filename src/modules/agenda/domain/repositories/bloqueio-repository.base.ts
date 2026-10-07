import type { BloqueioAgenda } from '../entities/bloqueio-agenda.entity';
import type {
  BuscarBloqueioParams,
  IBloqueioAgendaRepository,
  ListarBloqueiosParams,
  RemoverBloqueioParams,
} from './bloqueio-repository.interface';

export abstract class BloqueioAgendaRepository implements IBloqueioAgendaRepository {
  abstract buscarPorId(params: BuscarBloqueioParams): Promise<BloqueioAgenda | null>;
  abstract listar(params: ListarBloqueiosParams): Promise<BloqueioAgenda[]>;
  abstract salvar(bloqueio: BloqueioAgenda): Promise<void>;
  abstract remover(params: RemoverBloqueioParams): Promise<void>;
}
