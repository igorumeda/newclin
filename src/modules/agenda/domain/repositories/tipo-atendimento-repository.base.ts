import type { TipoAtendimento } from '../entities/tipo-atendimento.entity';
import type {
  BuscarTipoAtendimentoParams,
  BuscarTipoPorNomeParams,
  ITipoAtendimentoRepository,
  ListarTiposAtendimentoParams,
} from './tipo-atendimento-repository.interface';

export abstract class TipoAtendimentoRepository implements ITipoAtendimentoRepository {
  abstract buscarPorId(params: BuscarTipoAtendimentoParams): Promise<TipoAtendimento | null>;
  abstract buscarPorNome(params: BuscarTipoPorNomeParams): Promise<TipoAtendimento | null>;
  abstract listar(params: ListarTiposAtendimentoParams): Promise<TipoAtendimento[]>;
  abstract salvar(tipo: TipoAtendimento): Promise<void>;
  abstract atualizar(tipo: TipoAtendimento): Promise<void>;
}
