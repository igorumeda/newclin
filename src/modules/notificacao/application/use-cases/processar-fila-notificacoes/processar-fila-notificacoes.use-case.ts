import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Notificacao } from '../../../domain/entities/notificacao.entity';
import type { IDestinatarioRepository } from '../../../domain/repositories/destinatario-repository.interface';
import type { IMensagemWhatsAppRepository } from '../../../domain/repositories/mensagem-whatsapp-repository.interface';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import type { IEmailProvider } from '../../../domain/services/email-provider.interface';
import type { IWhatsAppProvider } from '../../../domain/services/whatsapp-provider.interface';
import { MontadorMensagemService } from '../../../domain/services/montador-mensagem.service';
import type { ProcessarFilaNotificacoesInputDto } from './processar-fila-notificacoes.input.dto';

export type ProcessarFilaNotificacoesDependencies = {
  notificacaoRepository: INotificacaoRepository;
  destinatarioRepository: IDestinatarioRepository;
  mensagemWhatsAppRepository: IMensagemWhatsAppRepository;
  emailProvider: IEmailProvider;
  whatsappProvider: IWhatsAppProvider;
  montadorMensagem: MontadorMensagemService;
};

export type ProcessarFilaNotificacoesOutputDto = {
  processadas: number;
  enviadas: number;
  falhas: number;
  fallbacks: number;
};

type EnviarParams = { notificacao: Notificacao };
type ResultadoEnvio = {
  sucesso: boolean;
  provider: string;
  mensagemId: string | null;
  erro: string | null;
};
type FallbackParams = { original: Notificacao };

const LIMITE_PADRAO = 25;
const MAX_TENTATIVAS_PADRAO = 3;

/** Worker da fila de notificações: envia, registra log e aplica fallback de e-mail. */
export class ProcessarFilaNotificacoesUseCase extends UseCase<
  ProcessarFilaNotificacoesInputDto,
  ProcessarFilaNotificacoesOutputDto
> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly destinatarioRepository: IDestinatarioRepository;
  private readonly mensagemWhatsAppRepository: IMensagemWhatsAppRepository;
  private readonly emailProvider: IEmailProvider;
  private readonly whatsappProvider: IWhatsAppProvider;
  private readonly montadorMensagem: MontadorMensagemService;

  constructor(dependencies: ProcessarFilaNotificacoesDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.destinatarioRepository = dependencies.destinatarioRepository;
    this.mensagemWhatsAppRepository = dependencies.mensagemWhatsAppRepository;
    this.emailProvider = dependencies.emailProvider;
    this.whatsappProvider = dependencies.whatsappProvider;
    this.montadorMensagem = dependencies.montadorMensagem;
  }

  async execute(
    input: ProcessarFilaNotificacoesInputDto,
  ): Promise<Result<ProcessarFilaNotificacoesOutputDto>> {
    const maxTentativas = input.maxTentativas ?? MAX_TENTATIVAS_PADRAO;
    const pendentes = await this.notificacaoRepository.listarPendentes({
      limite: input.limite ?? LIMITE_PADRAO,
      referencia: new Date(),
    });

    let enviadas = 0;
    let falhas = 0;
    let fallbacks = 0;

    for (const notificacao of pendentes) {
      notificacao.marcarProcessando();
      await this.notificacaoRepository.atualizar(notificacao);

      const resultado = await this.enviar({ notificacao });

      if (resultado.sucesso) {
        notificacao.marcarEnviada({
          provider: resultado.provider,
          providerMessageId: resultado.mensagemId,
        });
        await this.notificacaoRepository.atualizar(notificacao);
        enviadas += 1;
        continue;
      }

      notificacao.registrarFalha({ erro: resultado.erro ?? 'Falha desconhecida', maxTentativas });
      await this.notificacaoRepository.atualizar(notificacao);

      if (notificacao.status === 'falha') {
        falhas += 1;
        if ((input.habilitarFallbackEmail ?? true) && notificacao.canal.value === 'whatsapp') {
          const criou = await this.criarFallbackEmail({ original: notificacao });
          if (criou) fallbacks += 1;
        }
      }
    }

    return Result.ok({ processadas: pendentes.length, enviadas, falhas, fallbacks });
  }

  private async enviar({ notificacao }: EnviarParams): Promise<ResultadoEnvio> {
    if (notificacao.canal.value === 'email') {
      const resposta = await this.emailProvider.enviar({
        destinatario: notificacao.destinatario,
        assunto: notificacao.assunto ?? notificacao.tipo.rotulo,
        corpoTexto: notificacao.conteudo,
      });
      return resposta;
    }

    const resposta = await this.whatsappProvider.enviar({
      telefone: notificacao.destinatario,
      mensagem: notificacao.conteudo,
      variaveis: notificacao.variaveis,
    });

    if (resposta.sucesso) {
      await this.mensagemWhatsAppRepository.registrar({
        redeId: notificacao.redeId,
        direcao: 'saida',
        telefone: notificacao.destinatario,
        conteudo: notificacao.conteudo,
        provider: resposta.provider,
        providerMessageId: resposta.mensagemId,
        agendamentoId: notificacao.agendamentoId,
        pacienteId: notificacao.pacienteId,
      });
    }
    return resposta;
  }

  /** Spec §4.2: se o WhatsApp falhar, cai para e-mail automaticamente. */
  private async criarFallbackEmail({ original }: FallbackParams): Promise<boolean> {
    if (!original.agendamentoId) return false;

    const destinatario = await this.destinatarioRepository.buscarPorAgendamento({
      redeId: original.redeId,
      agendamentoId: original.agendamentoId,
    });
    if (!destinatario?.pacienteEmail) return false;

    const mensagemResult = this.montadorMensagem.execute({
      canal: 'email',
      tipo: original.tipo.value,
      variaveis: original.variaveis,
    });
    if (mensagemResult.isFailure) return false;

    const notificacaoResult = Notificacao.create({
      redeId: original.redeId,
      canal: 'email',
      tipo: original.tipo.value,
      destinatario: destinatario.pacienteEmail,
      assunto: mensagemResult.value.assunto,
      conteudo: mensagemResult.value.conteudo,
      variaveis: original.variaveis,
      agendamentoId: original.agendamentoId,
      pacienteId: original.pacienteId,
      fallbackDe: original.id.toString(),
    });
    if (notificacaoResult.isFailure) return false;

    await this.notificacaoRepository.salvar(notificacaoResult.value);
    return true;
  }
}
