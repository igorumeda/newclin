import type { Agendamento } from '../entities/agendamento.entity';
import type {
  AgendamentoId,
  HistoricoStatusItem,
  IAgendamentoRepository,
  ListarAgendamentosFiltro,
  ListarAgendamentosResultado,
  VerificarConflitoParams,
} from './agendamento-repository.interface';
import type { BloqueioAgendaDetalhe, ConflitoAgendaDetalhe } from '../errors/agendamento.errors';

export abstract class AgendamentoRepository implements IAgendamentoRepository {
  abstract findById(id: AgendamentoId): Promise<Agendamento | null>;
  abstract listar(filtro: ListarAgendamentosFiltro): Promise<ListarAgendamentosResultado>;
  abstract save(agendamento: Agendamento): Promise<void>;
  abstract update(agendamento: Agendamento): Promise<void>;
  abstract verificarConflito(params: VerificarConflitoParams): Promise<ConflitoAgendaDetalhe[]>;
  abstract verificarBloqueio(params: {
    profissionalId: string;
    unidadeId: string;
    inicio: string;
    fim: string;
  }): Promise<BloqueioAgendaDetalhe[]>;
  abstract listarHistorico(agendamentoId: string): Promise<HistoricoStatusItem[]>;
  abstract contarFuturosPorProfissional(params: {
    profissionalId: string;
    aPartirDe: string;
  }): Promise<number>;
}
