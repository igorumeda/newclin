import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { InvalidNotificationOperationError } from '../errors/notificacao.errors';
import type { CanalNotificacao, TipoNotificacao, VariaveisMensagem } from '../value-objects/tipos.vo';

export type ModeloMensagemProps = {
  redeId: string;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
  assunto: string | null;
  corpo: string;
  ativo: boolean;
  isPadrao: boolean;
};

export type ModeloMensagemConstructorParams = EntityConstructorParams<ModeloMensagemProps>;

export type CreateModeloMensagemParams = {
  redeId: string;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
  assunto?: string | null;
  corpo: string;
  ativo?: boolean;
  isPadrao?: boolean;
};

const VARIAVEL_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Modelo de mensagem por rede/canal/tipo, com variáveis no formato
 * `{{variavel}}` (§4.1). O envio usa o modelo ativo da rede; se não houver,
 * usa o padrão do sistema.
 */
export class ModeloMensagem extends AggregateRoot<ModeloMensagemProps> {
  private constructor(params: ModeloMensagemConstructorParams) {
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
  get assunto(): string | null {
    return this.props.assunto;
  }
  get corpo(): string {
    return this.props.corpo;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }
  get isPadrao(): boolean {
    return this.props.isPadrao;
  }

  /** Variáveis declaradas no corpo/assunto — usado na validação do editor. */
  public variaveis(): string[] {
    const encontradas = new Set<string>();
    for (const texto of [this.props.assunto ?? '', this.props.corpo]) {
      for (const match of texto.matchAll(VARIAVEL_PATTERN)) {
        encontradas.add(match[1]);
      }
    }
    return [...encontradas];
  }

  /** Interpola as variáveis; marcadores sem valor permanecem visíveis para diagnóstico. */
  public renderizar(variaveis: VariaveisMensagem): { assunto: string | null; corpo: string } {
    const interpolar = (texto: string): string =>
      texto.replace(VARIAVEL_PATTERN, (original, chave: string) => {
        const valor = variaveis[chave];
        return valor === undefined || valor === null ? original : valor;
      });

    return {
      assunto: this.props.assunto ? interpolar(this.props.assunto) : null,
      corpo: interpolar(this.props.corpo),
    };
  }

  public static create(params: CreateModeloMensagemParams): Result<ModeloMensagem> {
    if (!params.corpo || params.corpo.trim().length < 5) {
      return Result.fail(
        new InvalidNotificationOperationError({ reason: 'Corpo do modelo deve ter ao menos 5 caracteres' }),
      );
    }
    if (params.canal === 'email' && !params.assunto) {
      return Result.fail(
        new InvalidNotificationOperationError({ reason: 'Modelos de e-mail exigem assunto' }),
      );
    }

    return Result.ok(
      new ModeloMensagem({
        props: {
          redeId: params.redeId,
          canal: params.canal,
          tipo: params.tipo,
          assunto: params.assunto?.trim() || null,
          corpo: params.corpo.trim(),
          ativo: params.ativo ?? true,
          isPadrao: params.isPadrao ?? false,
        },
      }),
    );
  }

  public static reconstitute(params: ModeloMensagemConstructorParams): ModeloMensagem {
    return new ModeloMensagem(params);
  }

  public atualizar(params: { assunto?: string | null; corpo?: string; ativo?: boolean }): Result<void> {
    if (params.corpo !== undefined) {
      if (params.corpo.trim().length < 5) {
        return Result.fail(
          new InvalidNotificationOperationError({ reason: 'Corpo do modelo deve ter ao menos 5 caracteres' }),
        );
      }
      this.props.corpo = params.corpo.trim();
    }

    if (params.assunto !== undefined) {
      if (this.props.canal === 'email' && !params.assunto) {
        return Result.fail(
          new InvalidNotificationOperationError({ reason: 'Modelos de e-mail exigem assunto' }),
        );
      }
      this.props.assunto = params.assunto?.trim() || null;
    }

    if (params.ativo !== undefined) this.props.ativo = params.ativo;

    this.touch();
    return Result.ok();
  }
}
