import type { Adendo } from '../entities/adendo.entity';
import type { Atendimento } from '../entities/atendimento.entity';
import type {
  BuscarAtendimentoParams,
  BuscarPorAgendamentoParams,
  ContarAtendimentosParams,
  IAtendimentoRepository,
  ListarAdendosParams,
  ListarAtendimentosParams,
} from './atendimento-repository.interface';

export abstract class AtendimentoRepository implements IAtendimentoRepository {
  abstract buscarPorId(params: BuscarAtendimentoParams): Promise<Atendimento | null>;
  abstract buscarPorAgendamento(params: BuscarPorAgendamentoParams): Promise<Atendimento | null>;
  abstract listar(params: ListarAtendimentosParams): Promise<Atendimento[]>;
  abstract contar(params: ContarAtendimentosParams): Promise<number>;
  abstract listarAdendos(params: ListarAdendosParams): Promise<Adendo[]>;
  abstract salvar(atendimento: Atendimento): Promise<void>;
  abstract atualizar(atendimento: Atendimento): Promise<void>;
  abstract salvarAdendo(adendo: Adendo): Promise<void>;
}
