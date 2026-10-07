import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';

export const ACOES_AUDITORIA = [
  'criar',
  'atualizar',
  'excluir',
  'visualizar',
  'login',
  'logout',
  'exportar',
  'emitir',
] as const;
export type AcaoAuditoria = (typeof ACOES_AUDITORIA)[number];

export const ROTULO_ACAO: Record<AcaoAuditoria, string> = {
  criar: 'Criação',
  atualizar: 'Atualização',
  excluir: 'Exclusão',
  visualizar: 'Visualização',
  login: 'Login',
  logout: 'Logout',
  exportar: 'Exportação',
  emitir: 'Emissão',
};

export type DadosAuditoria = Record<string, unknown> | null;

export type RegistroAuditoriaProps = {
  redeId: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  unidadeId: string | null;
  acao: AcaoAuditoria;
  entidade: string;
  entidadeId: string | null;
  descricao: string | null;
  dadosAntes: DadosAuditoria;
  dadosDepois: DadosAuditoria;
  ip: string | null;
  userAgent: string | null;
};

export type RegistroAuditoriaConstructorParams = EntityConstructorParams<RegistroAuditoriaProps>;
export type ReconstituirRegistroParams = RegistroAuditoriaConstructorParams & {
  id: NonNullable<RegistroAuditoriaConstructorParams['id']>;
};
export type CriarRegistroAuditoriaParams = {
  redeId: string;
  usuarioId?: string | null;
  usuarioNome?: string | null;
  unidadeId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  descricao?: string | null;
  dadosAntes?: DadosAuditoria;
  dadosDepois?: DadosAuditoria;
  ip?: string | null;
  userAgent?: string | null;
};

export class RegistroAuditoria extends Entity<RegistroAuditoriaProps> {
  private constructor(params: RegistroAuditoriaConstructorParams) {
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

  get unidadeId(): string | null {
    return this.props.unidadeId;
  }

  get acao(): AcaoAuditoria {
    return this.props.acao;
  }

  get acaoRotulo(): string {
    return ROTULO_ACAO[this.props.acao];
  }

  get entidade(): string {
    return this.props.entidade;
  }

  get entidadeId(): string | null {
    return this.props.entidadeId;
  }

  get descricao(): string | null {
    return this.props.descricao;
  }

  get dadosAntes(): DadosAuditoria {
    return this.props.dadosAntes;
  }

  get dadosDepois(): DadosAuditoria {
    return this.props.dadosDepois;
  }

  get ip(): string | null {
    return this.props.ip;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  public static create(params: CriarRegistroAuditoriaParams): Result<RegistroAuditoria> {
    if (!ACOES_AUDITORIA.includes(params.acao as AcaoAuditoria)) {
      return Result.fail(new Error(`Ação de auditoria inválida: ${params.acao}`));
    }
    if (!params.entidade?.trim()) {
      return Result.fail(new Error('Informe a entidade auditada'));
    }

    return Result.ok(
      new RegistroAuditoria({
        props: {
          redeId: params.redeId,
          usuarioId: params.usuarioId ?? null,
          usuarioNome: params.usuarioNome ?? null,
          unidadeId: params.unidadeId ?? null,
          acao: params.acao as AcaoAuditoria,
          entidade: params.entidade.trim(),
          entidadeId: params.entidadeId ?? null,
          descricao: params.descricao?.trim() || null,
          dadosAntes: params.dadosAntes ?? null,
          dadosDepois: params.dadosDepois ?? null,
          ip: params.ip ?? null,
          userAgent: params.userAgent ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirRegistroParams): RegistroAuditoria {
    return new RegistroAuditoria(params);
  }
}
