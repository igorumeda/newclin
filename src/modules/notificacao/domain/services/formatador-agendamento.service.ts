import { DomainService } from '@core/domain/domain-service.base';
import { Result } from '@core/domain/result';
import type { DestinatarioAgendamento } from '../repositories/destinatario-repository.interface';
import type { VariaveisNotificacao } from '../entities/notificacao.entity';

export type MontarVariaveisParams = {
  destinatario: DestinatarioAgendamento;
  motivo?: string | null;
  documento?: string | null;
};

/**
 * Converte a projeção do agendamento nas variáveis dos templates. A conversão
 * de fuso horário acontece na borda (projeção de leitura), não aqui.
 */
export class FormatadorAgendamentoService extends DomainService<
  MontarVariaveisParams,
  VariaveisNotificacao
> {
  public execute(params: MontarVariaveisParams): Result<VariaveisNotificacao> {
    const { destinatario } = params;
    if (!destinatario.dataLocal || !destinatario.horaLocal) {
      return Result.fail(new Error('Agendamento sem data/hora formatadas'));
    }

    return Result.ok({
      paciente: destinatario.pacienteNome,
      profissional: destinatario.profissionalNome,
      unidade: destinatario.unidadeNome,
      endereco: destinatario.unidadeEndereco,
      telefoneUnidade: destinatario.unidadeTelefone ?? '',
      rede: destinatario.redeNome,
      data: destinatario.dataLocal,
      hora: destinatario.horaLocal,
      motivo: params.motivo ?? 'não informado',
      documento: params.documento ?? '',
    });
  }
}
