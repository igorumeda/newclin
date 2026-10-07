import { DomainService } from '@core/domain/domain-service.base';
import { Result } from '@core/domain/result';
import type { Agendamento } from '../entities/agendamento.entity';
import type { BloqueioAgenda } from '../entities/bloqueio-agenda.entity';
import type { Periodo } from '../value-objects/periodo.vo';
import { ConflitoAgendaError } from '../errors/conflito-agenda.error';

export type VerificarConflitoParams = {
  profissionalId: string;
  unidadeId: string;
  periodo: Periodo;
  encaixe: boolean;
  agendamentosExistentes: Agendamento[];
  bloqueios: BloqueioAgenda[];
};

export type ResultadoConflito = {
  temConflito: boolean;
  avisos: string[];
  agendamentosConflitantes: string[];
};

/**
 * Regras de conflito (spec §3.4):
 *  - Bloqueio sempre impede o agendamento.
 *  - Sobreposição com outro atendimento ativo impede, exceto em encaixe,
 *    quando apenas gera aviso visual.
 */
export class VerificadorConflitoService extends DomainService<
  VerificarConflitoParams,
  ResultadoConflito
> {
  public execute(params: VerificarConflitoParams): Result<ResultadoConflito> {
    const bloqueio = params.bloqueios.find((item) =>
      item.afeta({
        profissionalId: params.profissionalId,
        unidadeId: params.unidadeId,
        periodo: params.periodo,
      }),
    );
    if (bloqueio) {
      return Result.fail(
        new ConflitoAgendaError({
          detalhe: `horário bloqueado (${bloqueio.motivo})`,
        }),
      );
    }

    const conflitantes = params.agendamentosExistentes.filter(
      (agendamento) =>
        agendamento.status.isAtivo &&
        agendamento.profissionalId === params.profissionalId &&
        agendamento.unidadeId === params.unidadeId &&
        agendamento.periodo.sobrepoe({ periodo: params.periodo }),
    );

    if (conflitantes.length === 0) {
      return Result.ok({ temConflito: false, avisos: [], agendamentosConflitantes: [] });
    }

    if (!params.encaixe) {
      return Result.fail(
        new ConflitoAgendaError({
          detalhe: 'já existe atendimento para este profissional no horário selecionado',
        }),
      );
    }

    return Result.ok({
      temConflito: true,
      avisos: [
        `Encaixe sobre ${conflitantes.length} atendimento(s) já marcado(s) neste horário`,
      ],
      agendamentosConflitantes: conflitantes.map((item) => item.id.toString()),
    });
  }
}
