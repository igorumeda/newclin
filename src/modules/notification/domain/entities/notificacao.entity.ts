import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Destinatario } from '../value-objects/destinatario.vo';
import { STATUS_FINAIS } from '../value-objects/notificacao.vo';
import type {
  CanalNotificacao,
  RespostaAcao,
  StatusNotificacao,
  TipoNotificacao,
  VariaveisMensagem,
} from '../value-objects/tipos.vo';
import { InvalidNotificationOperationError } from '../errors/notificacao.errors';

export type NotificacaoProps = {
  redeId: string;
  agendamentoId: string | null;
  pacienteId: string | null;
  atendimentoId: string | null;
  documentoId: string | null;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
  destinatario: Destinatario;
  remetente: string | null;
  assunto: string | null;
  conteudo: string;
  status: StatusNotificacao;
  provider: string | null;
  providerMessageId: string | null;
  tentativas: number;
  ultimoErro: string | null;
  agendadaPara: Date;
  enviadaEm: Date | null;
  entregueEm: Date | null;
  respondidaEm: Date | null;
  resposta: string | null;
  respostaAcao: RespostaAcao | null;
  createdBy: string | null;
};

export type NotificacaoConstructorParams = EntityConstructorParams<NotificacaoProps>;

export type CreateNotificacaoParams = {
  redeId: string;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
  destinatario: Destinatario;
  conteudo: string;
  assunto?: string | null;
  remetente?: string | null;
  agendamentoId?: string | null;
  pacienteId?: string | null;
  atendimentoId?: string | null;
  documentoId?: string | null;
  agendadaPara?: Date | null;
  createdBy?: string | null;
};

export type RegistrarEnvioParams = {
  provider: string;
  providerMessageId: string | null;
  remetente?: string | null;
};

/**
 * Notificação — item da fila e, ao mesmo tempo, log imutável do envio
 * (§4.1/§4.2). Nunca é excluída: status finais apenas encerram o item.
 */
export class Notificacao extends AggregateRoot<NotificacaoProps> {
  private constructor(params: NotificacaoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get agendamentoId(): string | null {
    return this.props.agendamentoId;
  }
  get pacienteId(): string | null {
    return this.props.pacienteId;
  }
  get atendimentoId(): string | null {
    return this.props.atendimentoId;
  }
  get documentoId(): string | null {
    return this.props.documentoId;
  }
  get canal(): CanalNotificacao {
    return this.props.canal;
  }
  get tipo(): TipoNotificacao {
    return this.props.tipo;
  }
  get destinatario(): Destinatario {
    return this.props.destinatario;
  }
  get remetente(): string | null {
    return this.props.remetente;
  }
  get assunto(): string | null {
    return this.props.assunto;
  }
  get conteudo(): string {
    return this.props.conteudo;
  }
  get status(): StatusNotificacao {
    return this.props.status;
  }
  get provider(): string | null {
    return this.props.provider;
  }
  get providerMessageId(): string | null {
    return this.props.providerMessageId;
  }
  get tentativas(): number {
    return this.props.tentativas;
  }
  get ultimoErro(): string | null {
    return this.props.ultimoErro;
  }
  get agendadaPara(): Date {
    return this.props.agendadaPara;
  }
  get enviadaEm(): Date | null {
    return this.props.enviadaEm;
  }
  get entregueEm(): Date | null {
    return this.props.entregueEm;
  }
  get respondidaEm(): Date | null {
    return this.props.respondidaEm;
  }
  get resposta(): string | null {
    return this.props.resposta;
  }
  get respostaAcao(): RespostaAcao | null {
    return this.props.respostaAcao;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }

  public estaPendente(): boolean {
    return this.props.status === 'pendente';
  }

  public podeRetentar(maxTentativas: number): boolean {
    return this.estaPendente() && this.props.tentativas < maxTentativas;
  }

  public podeSerEnviadaEm(referencia: Date = new Date()): boolean {
    return this.estaPendente() && this.props.agendadaPara.getTime() <= referencia.getTime();
  }

  public static create(params: CreateNotificacaoParams): Result<Notificacao> {
    if (!params.conteudo || params.conteudo.trim().length === 0) {
      return Result.fail(new InvalidNotificationOperationError({ reason: 'Conteúdo da mensagem é obrigatório' }));
    }

    return Result.ok(
      new Notificacao({
        props: {
          redeId: params.redeId,
          agendamentoId: params.agendamentoId ?? null,
          pacienteId: params.pacienteId ?? null,
          atendimentoId: params.atendimentoId ?? null,
          documentoId: params.documentoId ?? null,
          canal: params.canal,
          tipo: params.tipo,
          destinatario: params.destinatario,
          remetente: params.remetente ?? null,
          assunto: params.assunto ?? null,
          conteudo: params.conteudo,
          status: 'pendente',
          provider: null,
          providerMessageId: null,
          tentativas: 0,
          ultimoErro: null,
          agendadaPara: params.agendadaPara ?? new Date(),
          enviadaEm: null,
          entregueEm: null,
          respondidaEm: null,
          resposta: null,
          respostaAcao: null,
          createdBy: params.createdBy ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: NotificacaoConstructorParams): Notificacao {
    return new Notificacao(params);
  }

  public registrarTentativa(): Result<void> {
    if (STATUS_FINAIS.includes(this.props.status)) {
      return Result.fail(
        new InvalidNotificationOperationError({
          reason: `Notificação com status "${this.props.status}" não pode ser reenviada`,
        }),
      );
    }

    this.props.tentativas += 1;
    this.touch();
    return Result.ok();
  }

  public marcarEnviada(params: RegistrarEnvioParams): Result<void> {
    this.props.status = 'enviado';
    this.props.provider = params.provider;
    this.props.providerMessageId = params.providerMessageId;
    if (params.remetente !== undefined) this.props.remetente = params.remetente;
    this.props.enviadaEm = new Date();
    this.props.ultimoErro = null;
    this.touch();
    return Result.ok();
  }

  public marcarEntregue(): Result<void> {
    if (this.props.status === 'pendente') {
      return Result.fail(
        new InvalidNotificationOperationError({
          reason: 'Notificação ainda não foi enviada ao provedor',
        }),
      );
    }

    this.props.status = 'entregue';
    this.props.entregueEm = new Date();
    this.touch();
    return Result.ok();
  }

  public marcarLida(): Result<void> {
    this.props.status = 'lido';
    this.touch();
    return Result.ok();
  }

  /** Falha transitória: mantém na fila com backoff para nova tentativa. */
  public marcarFalhaRetentavel(params: { motivo: string; reagendarPara: Date }): Result<void> {
    if (STATUS_FINAIS.includes(this.props.status)) {
      return Result.fail(
        new InvalidNotificationOperationError({
          reason: `Notificação finalizada com status "${this.props.status}" não retorna à fila`,
        }),
      );
    }

    this.props.status = 'pendente';
    this.props.ultimoErro = params.motivo;
    this.props.agendadaPara = params.reagendarPara;
    this.touch();
    return Result.ok();
  }

  public marcarFalha(motivo: string): Result<void> {
    this.props.status = 'falha';
    this.props.ultimoErro = motivo;
    this.touch();
    return Result.ok();
  }

  public marcarRespondida(params: { resposta: string; acao: RespostaAcao | null }): Result<void> {
    if (this.props.status === 'cancelado') {
      return Result.fail(
        new InvalidNotificationOperationError({ reason: 'Notificação cancelada não aceita respostas' }),
      );
    }

    this.props.status = 'respondido';
    this.props.resposta = params.resposta;
    this.props.respostaAcao = params.acao;
    this.props.respondidaEm = new Date();
    this.touch();
    return Result.ok();
  }

  public cancelar(motivo?: string): Result<void> {
    if (STATUS_FINAIS.includes(this.props.status)) {
      return Result.fail(
        new InvalidNotificationOperationError({
          reason: `Notificação já finalizada com status "${this.props.status}"`,
        }),
      );
    }

    this.props.status = 'cancelado';
    if (motivo) this.props.ultimoErro = motivo;
    this.touch();
    return Result.ok();
  }

  /** Variáveis usadas na renderização dos modelos (nunca incluem dados clínicos). */
  public static readonly VARIAVEIS_SUPORTADAS = [
    'paciente_nome',
    'paciente_primeiro_nome',
    'data',
    'hora',
    'profissional_nome',
    'profissional_especialidade',
    'unidade_nome',
    'unidade_endereco',
    'unidade_telefone',
    'rede_nome',
    'tipo_documento',
    'data_emissao',
    'link_documento',
  ];

  public variaveis(): VariaveisMensagem {
    return { conteudo: this.props.conteudo };
  }
}
