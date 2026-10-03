import type { TipoAtendimento } from '../entities/tipo-atendimento.entity';
import type {
  ITipoAtendimentoRepository,
  ListarTiposAtendimentoFiltro,
} from './tipo-atendimento-repository.interface';

export abstract class TipoAtendimentoRepository implements ITipoAtendimentoRepository {
  abstract findById(id: string): Promise<TipoAtendimento | null>;
  abstract listar(filtro: ListarTiposAtendimentoFiltro): Promise<TipoAtendimento[]>;
  abstract save(tipo: TipoAtendimento): Promise<void>;
  abstract update(tipo: TipoAtendimento): Promise<void>;
  abstract existsByNome(params: {
    redeId: string;
    nome: string;
    ignorarId?: string | null;
  }): Promise<boolean>;
}
