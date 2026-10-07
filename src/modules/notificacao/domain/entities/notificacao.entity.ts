import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { CanalNotificacao } from '../value-objects/canal-notificacao.vo';
import { TipoNotificacao } from '../value-objects/tipo-notificacao.vo';

export const STATUS_NOTIFICACAO = [
  'pendente',
  'processando',
  'enviado',
  'falha',
  'cancelado',
] as const;
export type StatusNotificacao = (typeof STATUS_NOTIFICACAO)[number];
export type VariaveisNotificacao = Record<string, string>;

export type NotificacaoProps = {
  redeId: string;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
  destinatario: string;
  assunto: string | null;
  conteudo: string;
  variaveis: VariaveisNotificacao;
  status: StatusNotificacao;
  tentativas: number;
  erro: string | null;
  agendadaPara: Date;
  enviadaEm: Date | null;
  agendamentoId: string | null;
  pacienteId: string | null;
  documentoId: string | null;
  provider: string | null;
  providerMessageId: string | null;
  fallbackDe: string | null;
};

export type NotificacaoConstructorParams = EntityConstructorParams<NotificacaoProps>;
export type ReconstituirNotificacaoParams = NotificacaoConstructorParams & {
  id: NonNullable<NotificacaoConstructorParams['id']>;
};
export type CriarNotificacaoParams = {
  redeId: string;
  canal: string;
  tipo: string;
  destinatario: string;
  assunto?: string | null;
  conteudo: string;
  variaveis?: VariaveisNotificacao;
  agendadaPara?: Date | string | null;
  agendamentoId?: string | null;
  pacienteId?: string | null;
  documentoId?: string | null;
  fallbackDe?: string | null;
};
export type MarcarEnviadaParams = { provider: string; providerMessageId: string | null };
export type RegistrarFalhaParams = { erro: string; maxTentativas: number };
export type PodeEnviarParams = { referencia?: Date };

export class Notificacao extends AggregateRoot<NotificacaoProps> {
  private constructor(params: NotificacaoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get canal(): CanalNotificacao {
    return this.props.canal;
  }

  get tipo(): TipoNotificacao {
    return this.props.tipo;
  }

  get destinatario(): string {
    return this.props.destinatario;
  }

  get assunto(): string | null {
    return this.props.assunto;
  }

  get conteudo(): string {
    return this.props.conteudo;
  }

  get variaveis(): VariaveisNotificacao {
    return this.props.variaveis;
  }

  get status(): StatusNotificacao {
    return this.props.status;
  }

  get tentativas(): number {
    return this.props.tentativas;
  }

  get erro(): string | null {
    return this.props.erro;
  }

  get agendadaPara(): Date {
    return this.props.agendadaPara;
  }

  get enviadaEm(): Date | null {
    return this.props.enviadaEm;
  }

  get agendamentoId(): string | null {
    return this.props.agendamentoId;
  }

  get pacienteId(): string | null {
    return this.props.pacienteId;
  }

  get documentoId(): string | null {
    return this.props.documentoId;
  }

  get provider(): string | null {
    return this.props.provider;
  }

  get providerMessageId(): string | null {
    return this.props.providerMessageId;
  }

  get fallbackDe(): string | null {
    return this.props.fallbackDe;
  }

  public static create(params: CriarNotificacaoParams): Result<Notificacao> {
    const canalResult = CanalNotificacao.create(params.canal);
    if (canalResult.isFailure) return Result.propagate(canalResult);

    const tipoResult = TipoNotificacao.create(params.tipo);
    if (tipoResult.isFailure) return Result.propagate(tipoResult);

    const destinatario = params.destinatario?.trim() ?? '';
    if (!destinatario) {
      return Result.fail(new Error('Informe o destinatário da notificação'));
    }
    if (!params.conteudo?.trim()) {
      return Result.fail(new Error('Conteúdo da notificação vazio'));
    }

    const agendadaPara = params.agendadaPara ? new Date(params.agendadaPara) : new Date();
    if (Number.isNaN(agendadaPara.getTime())) {
      return Result.fail(new Error('Data de agendamento da notificação inválida'));
    }

    return Result.ok(
      new Notificacao({
        props: {
          redeId: params.redeId,
          canal: canalResult.value,
          tipo: tipoResult.value,
          destinatario,
          assunto: params.assunto?.trim() || null,
          conteudo: params.conteudo.trim(),
          variaveis: params.variaveis ?? {},
          status: 'pendente',
          tentativas: 0,
          erro: null,
          agendadaPara,
          enviadaEm: null,
          agendamentoId: params.agendamentoId ?? null,
          pacienteId: params.pacienteId ?? null,
          documentoId: params.documentoId ?? null,
          provider: null,
          providerMessageId: null,
          fallbackDe: params.fallbackDe ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirNotificacaoParams): Notificacao {
    return new Notificacao(params);
  }

  public podeEnviar({ referencia = new Date() }: PodeEnviarParams = {}): boolean {
    return (
      ['pendente', 'processando'].includes(this.props.status) &&
      this.props.agendadaPara.getTime() <= referencia.getTime()
    );
  }

  public marcarProcessando(): void {
    this.props.status = 'processando';
    this.props.tentativas += 1;
    this.touch();
  }

  public marcarEnviada({ provider, providerMessageId }: MarcarEnviadaParams): void {
    this.props.status = 'enviado';
    this.props.provider = provider;
    this.props.providerMessageId = providerMessageId;
    this.props.enviadaEm = new Date();
    this.props.erro = null;
    this.touch();
  }

  /** Volta para a fila enquanto houver tentativas; depois marca falha definitiva. */
  public registrarFalha({ erro, maxTentativas }: RegistrarFalhaParams): void {
    this.props.erro = erro.slice(0, 500);
    if (this.props.tentativas >= maxTentativas) {
      this.props.status = 'falha';
    } else {
      this.props.status = 'pendente';
      this.props.agendadaPara = new Date(Date.now() + this.props.tentativas * 60_000);
    }
    this.touch();
  }

  public cancelar(): void {
    this.props.status = 'cancelado';
    this.touch();
  }
}
