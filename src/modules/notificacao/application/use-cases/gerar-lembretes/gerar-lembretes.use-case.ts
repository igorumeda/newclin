import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Notificacao } from '../../../domain/entities/notificacao.entity';
import type { IDestinatarioRepository } from '../../../domain/repositories/destinatario-repository.interface';
import type { DestinatarioAgendamento } from '../../../domain/repositories/destinatario-repository.interface';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import { FormatadorAgendamentoService } from '../../../domain/services/formatador-agendamento.service';
import { MontadorMensagemService } from '../../../domain/services/montador-mensagem.service';
import type { CanalNotificacaoValue } from '../../../domain/value-objects/canal-notificacao.vo';
import type { GerarLembretesInputDto } from './gerar-lembretes.input.dto';

export type GerarLembretesDependencies = {
  notificacaoRepository: INotificacaoRepository;
  destinatarioRepository: IDestinatarioRepository;
  montadorMensagem: MontadorMensagemService;
  formatadorAgendamento: FormatadorAgendamentoService;
};

export type GerarLembretesOutputDto = {
  analisados: number;
  criados: number;
  ignorados: number;
};

type CanaisDoDestinatarioParams = { destinatario: DestinatarioAgendamento };

const ANTECEDENCIA_PADRAO_HORAS = 24;
const JANELA_PADRAO_MINUTOS = 60;

/** Cria os lembretes de 24h antes da consulta (spec §4.2). */
export class GerarLembretesUseCase extends UseCase<GerarLembretesInputDto, GerarLembretesOutputDto> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly destinatarioRepository: IDestinatarioRepository;
  private readonly montadorMensagem: MontadorMensagemService;
  private readonly formatadorAgendamento: FormatadorAgendamentoService;

  constructor(dependencies: GerarLembretesDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.destinatarioRepository = dependencies.destinatarioRepository;
    this.montadorMensagem = dependencies.montadorMensagem;
    this.formatadorAgendamento = dependencies.formatadorAgendamento;
  }

  async execute(input: GerarLembretesInputDto): Promise<Result<GerarLembretesOutputDto>> {
    const antecedenciaHoras = input.antecedenciaHoras ?? ANTECEDENCIA_PADRAO_HORAS;
    const janelaMinutos = input.janelaMinutos ?? JANELA_PADRAO_MINUTOS;

    const agora = Date.now();
    const de = new Date(agora + antecedenciaHoras * 3_600_000);
    const ate = new Date(de.getTime() + janelaMinutos * 60_000);

    const destinatarios = await this.destinatarioRepository.listarParaLembrete({
      de: de.toISOString(),
      ate: ate.toISOString(),
      limite: input.limite ?? 200,
    });

    let criados = 0;
    let ignorados = 0;

    for (const destinatario of destinatarios) {
      const variaveisResult = this.formatadorAgendamento.execute({ destinatario });
      if (variaveisResult.isFailure) {
        ignorados += 1;
        continue;
      }

      for (const canal of this.canaisDoDestinatario({ destinatario })) {
        const destino =
          canal === 'email' ? destinatario.pacienteEmail : destinatario.pacienteTelefone;
        if (!destino) {
          ignorados += 1;
          continue;
        }

        const jaExiste = await this.notificacaoRepository.existe({
          agendamentoId: destinatario.agendamentoId,
          canal,
          tipo: 'lembrete_consulta',
        });
        if (jaExiste) {
          ignorados += 1;
          continue;
        }

        const mensagemResult = this.montadorMensagem.execute({
          canal,
          tipo: 'lembrete_consulta',
          variaveis: variaveisResult.value,
        });
        if (mensagemResult.isFailure) {
          ignorados += 1;
          continue;
        }

        const notificacaoResult = Notificacao.create({
          redeId: destinatario.redeId,
          canal,
          tipo: 'lembrete_consulta',
          destinatario: destino,
          assunto: mensagemResult.value.assunto,
          conteudo: mensagemResult.value.conteudo,
          variaveis: variaveisResult.value,
          agendamentoId: destinatario.agendamentoId,
          pacienteId: destinatario.pacienteId,
        });
        if (notificacaoResult.isFailure) {
          ignorados += 1;
          continue;
        }

        await this.notificacaoRepository.salvar(notificacaoResult.value);
        criados += 1;
      }
    }

    return Result.ok({ analisados: destinatarios.length, criados, ignorados });
  }

  private canaisDoDestinatario({
    destinatario,
  }: CanaisDoDestinatarioParams): CanalNotificacaoValue[] {
    const canais: CanalNotificacaoValue[] = [];
    if (destinatario.lembreteWhatsapp && destinatario.pacienteTelefone) canais.push('whatsapp');
    if (destinatario.lembreteEmail && destinatario.pacienteEmail) canais.push('email');
    return canais;
  }
}
