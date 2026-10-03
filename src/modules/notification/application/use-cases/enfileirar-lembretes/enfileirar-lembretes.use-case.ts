import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { formatInTimeZone } from 'date-fns-tz';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import type { IAgendamentoLembreteReader } from '../../../domain/services/agendamento-lembrete-reader.interface';
import type { NotificacaoDispatcher } from '../../services/notificacao-dispatcher.service';
import type {
  EnfileirarLembretesDetalheDto,
  EnfileirarLembretesInputDto,
  EnfileirarLembretesOutputDto,
} from '../../dtos/notificacao.dto';

export type EnfileirarLembretesDependencies = {
  agendamentoLembreteReader: IAgendamentoLembreteReader;
  notificacaoRepository: INotificacaoRepository;
  dispatcher: NotificacaoDispatcher;
  horasAntecedenciaPadrao: number;
  limitePadrao: number;
};

/**
 * Lembrete automático (padrão: 24h antes — §4.2).
 * Executado pelo worker/cron; ignora agendamentos que já possuem lembrete
 * enfileirado, cancelados, faltantes ou finalizados.
 */
export class EnfileirarLembretesUseCase extends UseCase<
  EnfileirarLembretesInputDto,
  EnfileirarLembretesOutputDto
> {
  private readonly agendamentoLembreteReader: IAgendamentoLembreteReader;
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly dispatcher: NotificacaoDispatcher;
  private readonly horasAntecedenciaPadrao: number;
  private readonly limitePadrao: number;

  constructor(dependencies: EnfileirarLembretesDependencies) {
    super();
    this.agendamentoLembreteReader = dependencies.agendamentoLembreteReader;
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.dispatcher = dependencies.dispatcher;
    this.horasAntecedenciaPadrao = dependencies.horasAntecedenciaPadrao;
    this.limitePadrao = dependencies.limitePadrao;
  }

  async execute(input: EnfileirarLembretesInputDto): Promise<Result<EnfileirarLembretesOutputDto>> {
    const horas = input.horasAntecedencia ?? this.horasAntecedenciaPadrao;
    const agora = new Date();
    const janelaFim = new Date(agora.getTime() + horas * 60 * 60 * 1000);

    const agendamentos = await this.agendamentoLembreteReader.listarParaLembrete({
      redeId: input.redeId ?? null,
      janelaInicio: agora,
      janelaFim,
      limite: input.limite ?? this.limitePadrao,
    });

    const detalhes: EnfileirarLembretesDetalheDto[] = [];
    let enfileirados = 0;

    for (const agendamento of agendamentos) {
      const jaEnfileirado = await this.jaPossuiLembrete(agendamento.agendamentoId);
      if (jaEnfileirado) {
        detalhes.push({
          agendamentoId: agendamento.agendamentoId,
          pacienteId: agendamento.pacienteId,
          canal: null,
          enfileirado: false,
          motivo: 'Lembrete já enfileirado nas últimas 24h',
        });
        continue;
      }

      const timezone = agendamento.timezone || 'America/Sao_Paulo';
      const resultado = await this.dispatcher.lembreteAgendamento({
        redeId: agendamento.redeId,
        redeNome: agendamento.redeNome,
        agendamentoId: agendamento.agendamentoId,
        data: formatInTimeZone(agendamento.dataHora, timezone, 'dd/MM/yyyy'),
        hora: formatInTimeZone(agendamento.dataHora, timezone, 'HH:mm'),
        profissionalNome: agendamento.profissionalNome,
        profissionalEspecialidade: agendamento.profissionalEspecialidade,
        paciente: {
          pacienteId: agendamento.pacienteId,
          pacienteNome: agendamento.pacienteNome,
          telefone: agendamento.telefone,
          email: agendamento.email,
        },
        unidade: {
          nome: agendamento.unidadeNome,
          enderecoCompleto: agendamento.unidadeEndereco,
          telefone: agendamento.unidadeTelefone,
        },
      });

      if (resultado.enfileiradas.length > 0) enfileirados += 1;

      detalhes.push({
        agendamentoId: agendamento.agendamentoId,
        pacienteId: agendamento.pacienteId,
        canal: resultado.canalEscolhido,
        enfileirado: resultado.enfileiradas.length > 0,
        motivo: resultado.motivo,
      });
    }

    return Result.ok({
      agendamentosAnalisados: agendamentos.length,
      lembretesEnfileirados: enfileirados,
      detalhes,
    });
  }

  private async jaPossuiLembrete(agendamentoId: string): Promise<boolean> {
    const { total } = await this.notificacaoRepository.buscar({
      redeId: '',
      agendamentoId,
      tipo: 'lembrete',
      page: 1,
      perPage: 1,
    });

    return total > 0;
  }
}
