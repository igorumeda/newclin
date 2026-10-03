import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { AcaoAuditoria } from '../value-objects/acao-auditoria.vo';

export type AuditoriaProps = {
  redeId: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  usuarioEmail: string | null;
  usuarioRole: string | null;
  unidadeId: string | null;
  acao: AcaoAuditoria;
  entidade: string;
  registroId: string | null;
  descricao: string | null;
  dadosAntes: Record<string, unknown> | null;
  dadosDepois: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  origem: string;
};

export type AuditoriaConstructorParams = EntityConstructorParams<AuditoriaProps>;

export type RegistrarAuditoriaParams = {
  redeId: string;
  usuarioId?: string | null;
  usuarioNome?: string | null;
  usuarioEmail?: string | null;
  usuarioRole?: string | null;
  unidadeId?: string | null;
  acao: string;
  entidade: string;
  registroId?: string | null;
  descricao?: string | null;
  dadosAntes?: Record<string, unknown> | null;
  dadosDepois?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  origem?: string;
};

/**
 * Registro de auditoria — imutável por natureza (somente inserção).
 * Toda ação sensível do sistema passa por aqui (§3.2 e §5).
 */
export class Auditoria extends Entity<AuditoriaProps> {
  private constructor(params: AuditoriaConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get usuarioId(): string | null {
    return this.props.usuarioId;
  }
  get usuarioNome(): string | null {
    return this.props.usuarioNome;
  }
  get usuarioEmail(): string | null {
    return this.props.usuarioEmail;
  }
  get usuarioRole(): string | null {
    return this.props.usuarioRole;
  }
  get unidadeId(): string | null {
    return this.props.unidadeId;
  }
  get acao(): AcaoAuditoria {
    return this.props.acao;
  }
  get entidade(): string {
    return this.props.entidade;
  }
  get registroId(): string | null {
    return this.props.registroId;
  }
  get descricao(): string | null {
    return this.props.descricao;
  }
  get dadosAntes(): Record<string, unknown> | null {
    return this.props.dadosAntes;
  }
  get dadosDepois(): Record<string, unknown> | null {
    return this.props.dadosDepois;
  }
  get ip(): string | null {
    return this.props.ip;
  }
  get userAgent(): string | null {
    return this.props.userAgent;
  }
  get origem(): string {
    return this.props.origem;
  }

  public static registrar(params: RegistrarAuditoriaParams): Result<Auditoria> {
    const acaoResult = AcaoAuditoria.create(params.acao);
    if (acaoResult.isFailure) return Result.fail(acaoResult.error);

    if (!params.entidade || params.entidade.trim().length === 0) {
      return Result.fail(new Error('Entidade é obrigatória no registro de auditoria'));
    }

    return Result.ok(
      new Auditoria({
        props: {
          redeId: params.redeId,
          usuarioId: params.usuarioId ?? null,
          usuarioNome: params.usuarioNome ?? null,
          usuarioEmail: params.usuarioEmail ?? null,
          usuarioRole: params.usuarioRole ?? null,
          unidadeId: params.unidadeId ?? null,
          acao: acaoResult.value,
          entidade: params.entidade,
          registroId: params.registroId ?? null,
          descricao: params.descricao ?? null,
          dadosAntes: params.dadosAntes ?? null,
          dadosDepois: params.dadosDepois ?? null,
          ip: params.ip ?? null,
          userAgent: params.userAgent ?? null,
          origem: params.origem ?? 'api',
        },
      }),
    );
  }

  public static reconstitute(params: AuditoriaConstructorParams & { id: NonNullable<AuditoriaConstructorParams['id']> }): Auditoria {
    return new Auditoria(params);
  }
}
