import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { NotificacaoNaoEnviavelError } from '../../../domain/errors/notificacao-nao-enviavel.error';
import { Notificacao } from '../../../domain/entities/notificacao.entity';
import type { IDestinatarioRepository } from '../../../domain/repositories/destinatario-repository.interface';
import type { DestinatarioAgendamento } from '../../../domain/repositories/destinatario-repository.interface';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import { FormatadorAgendamentoService } from '../../../domain/services/formatador-agendamento.service';
import { MontadorMensagemService } from '../../../domain/services/montador-mensagem.service';
import type { CanalNotificacaoValue } from '../../../domain/value-objects/canal-notificacao.vo';
import { NotificacaoMapper } from '../../mappers/notificacao.mapper';
import type { NotificacaoOutputDto } from '../../mappers/notificacao.output.dto';
import type { AgendarNotificacaoInputDto } from './agendar-notificacao.input.dto';

export type AgendarNotificacaoDependencies = {
  notificacaoRepository: INotificacaoRepository;
  destinatarioRepository: IDestinatarioRepository;
  montadorMensagem: MontadorMensagemService;
  formatadorAgendamento: FormatadorAgendamentoService;
  mapper: NotificacaoMapper;
};

export type AgendarNotificacaoOutputDto = {
  criadas: NotificacaoOutputDto[];
  ignoradas: string[];
};

type DestinoCanalParams = { canal: CanalNotificacaoValue; destinatario: DestinatarioAgendamento };
type CanaisHabilitadosParams = { destinatario: DestinatarioAgendamento };

export class AgendarNotificacaoUseCase extends UseCase<
  AgendarNotificacaoInputDto,
  AgendarNotificacaoOutputDto
> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly destinatarioRepository: IDestinatarioRepository;
  private readonly montadorMensagem: MontadorMensagemService;
  private readonly formatadorAgendamento: FormatadorAgendamentoService;
  private readonly mapper: NotificacaoMapper;

  constructor(dependencies: AgendarNotificacaoDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.destinatarioRepository = dependencies.destinatarioRepository;
    this.montadorMensagem = dependencies.montadorMensagem;
    this.formatadorAgendamento = dependencies.formatadorAgendamento;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AgendarNotificacaoInputDto): Promise<Result<AgendarNotificacaoOutputDto>> {
    const destinatario = await this.destinatarioRepository.buscarPorAgendamento({
      redeId: input.redeId,
      agendamentoId: input.agendamentoId,
    });
    if (!destinatario) {
      return Result.fail(
        new NotificacaoNaoEnviavelError({ motivo: 'Agendamento não encontrado para notificação' }),
      );
    }

    const variaveisResult = this.formatadorAgendamento.execute({
      destinatario,
      motivo: input.motivo,
    });
    if (variaveisResult.isFailure) return Result.propagate(variaveisResult);

    const canais = input.canais ?? this.canaisHabilitados({ destinatario });
    const criadas: NotificacaoOutputDto[] = [];
    const ignoradas: string[] = [];

    for (const canal of canais) {
      const destino = this.destinoDoCanal({ canal, destinatario });
      if (!destino) {
        ignoradas.push(`${canal}: paciente sem contato cadastrado`);
        continue;
      }

      if (input.evitarDuplicidade) {
        const jaExiste = await this.notificacaoRepository.existe({
          agendamentoId: input.agendamentoId,
          canal,
          tipo: input.tipo,
        });
        if (jaExiste) {
          ignoradas.push(`${canal}: notificação já registrada`);
          continue;
        }
      }

      const mensagemResult = this.montadorMensagem.execute({
        canal,
        tipo: input.tipo,
        variaveis: variaveisResult.value,
      });
      if (mensagemResult.isFailure) return Result.propagate(mensagemResult);

      const notificacaoResult = Notificacao.create({
        redeId: input.redeId,
        canal,
        tipo: input.tipo,
        destinatario: destino,
        assunto: mensagemResult.value.assunto,
        conteudo: mensagemResult.value.conteudo,
        variaveis: variaveisResult.value,
        agendadaPara: input.agendadaPara ?? null,
        agendamentoId: input.agendamentoId,
        pacienteId: destinatario.pacienteId,
      });
      if (notificacaoResult.isFailure) return Result.propagate(notificacaoResult);

      await this.notificacaoRepository.salvar(notificacaoResult.value);
      criadas.push(this.mapper.map({ notificacao: notificacaoResult.value }));
    }

    return Result.ok({ criadas, ignoradas });
  }

  private canaisHabilitados({ destinatario }: CanaisHabilitadosParams): CanalNotificacaoValue[] {
    const canais: CanalNotificacaoValue[] = [];
    if (destinatario.lembreteWhatsapp) canais.push('whatsapp');
    if (destinatario.lembreteEmail) canais.push('email');
    return canais;
  }

  private destinoDoCanal({ canal, destinatario }: DestinoCanalParams): string | null {
    return canal === 'email' ? destinatario.pacienteEmail : destinatario.pacienteTelefone;
  }
}
