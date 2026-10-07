import type { Agendamento } from '../entities/agendamento.entity';
import type {
  BuscarAgendamentoParams,
  ContagemPorStatus,
  ContarPorStatusParams,
  IAgendamentoRepository,
  ListarAgendamentosParams,
  ListarParaLembreteParams,
  ListarPorPacienteParams,
  ProximaOrdemChegadaParams,
} from './agendamento-repository.interface';

export abstract class AgendamentoRepository implements IAgendamentoRepository {
  abstract buscarPorId(params: BuscarAgendamentoParams): Promise<Agendamento | null>;
  abstract listar(params: ListarAgendamentosParams): Promise<Agendamento[]>;
  abstract listarPorPaciente(params: ListarPorPacienteParams): Promise<Agendamento[]>;
  abstract listarParaLembrete(params: ListarParaLembreteParams): Promise<Agendamento[]>;
  abstract proximaOrdemChegada(params: ProximaOrdemChegadaParams): Promise<number>;
  abstract contarPorStatus(params: ContarPorStatusParams): Promise<ContagemPorStatus[]>;
  abstract salvar(agendamento: Agendamento): Promise<void>;
  abstract atualizar(agendamento: Agendamento): Promise<void>;
}
