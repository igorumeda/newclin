import type {
  AgendamentoDetalhado,
  ConsultarAgendaParams,
  ConsultarAgendamentoParams,
  IAgendaConsultaRepository,
} from './agenda-consulta-repository.interface';

export abstract class AgendaConsultaRepository implements IAgendaConsultaRepository {
  abstract consultar(params: ConsultarAgendaParams): Promise<AgendamentoDetalhado[]>;
  abstract obter(params: ConsultarAgendamentoParams): Promise<AgendamentoDetalhado | null>;
}
