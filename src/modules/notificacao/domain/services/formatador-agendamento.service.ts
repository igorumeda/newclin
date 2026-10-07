import { DomainService } from '@core/domain/domain-service.base';
import { Result } from '@core/domain/result';
import type { DestinatarioAgendamento } from '../repositories/destinatario-repository.interface';
import type { VariaveisNotificacao } from '../entities/notificacao.entity';

export type MontarVariaveisParams = {
  destinatario: DestinatarioAgendamento;
  motivo?: string | null;
  documento?: string | null;
};

/** Converte a projeção do agendamento nas variáveis dos templates, no fuso da unidade. */
export class FormatadorAgendamentoService extends DomainService<
  MontarVariaveisParams,
  VariaveisNotificacao
> {
  public execute(params: MontarVariaveisParams): Result<VariaveisNotificacao> {
    const inicio = new Date(params.destinatario.inicio);
    if (Number.isNaN(inicio.getTime())) {
      return Result.fail(new Error('Data do agendamento inválida'));
    }

    const fuso = params.destinatario.unidadeFusoHorario || 'America/Sao_Paulo';
    const data = new Intl.DateTimeFormat('pt-BR', {
      timeZone: fuso,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(inicio);
    const hora = new Intl.DateTimeFormat('pt-BR', {
      timeZone: fuso,
      hour: '2-digit',
      minute: '2-digit',
    }).format(inicio);

    return Result.ok({
      paciente: params.destinatario.pacienteNome,
      profissional: params.destinatario.profissionalNome,
      unidade: params.destinatario.unidadeNome,
      endereco: params.destinatario.unidadeEndereco,
      telefoneUnidade: params.destinatario.unidadeTelefone ?? '',
      rede: params.destinatario.redeNome,
      data,
      hora,
      motivo: params.motivo ?? 'não informado',
      documento: params.documento ?? '',
    });
  }
}
