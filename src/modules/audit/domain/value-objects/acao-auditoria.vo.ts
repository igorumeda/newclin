import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type AcaoAuditoriaValue =
  | 'criar'
  | 'atualizar'
  | 'excluir'
  | 'ler'
  | 'login'
  | 'logout'
  | 'exportar'
  | 'emitir'
  | 'cancelar'
  | 'processar';

export type AcaoAuditoriaProps = { value: AcaoAuditoriaValue };

export const ACOES_AUDITORIA: AcaoAuditoriaValue[] = [
  'criar',
  'atualizar',
  'excluir',
  'ler',
  'login',
  'logout',
  'exportar',
  'emitir',
  'cancelar',
  'processar',
];

export const ACAO_LABELS: Record<AcaoAuditoriaValue, string> = {
  criar: 'Criação',
  atualizar: 'Alteração',
  excluir: 'Exclusão',
  ler: 'Leitura',
  login: 'Login',
  logout: 'Logout',
  exportar: 'Exportação',
  emitir: 'Emissão',
  cancelar: 'Cancelamento',
  processar: 'Processamento',
};

export class AcaoAuditoria extends ValueObject<AcaoAuditoriaProps> {
  private constructor(props: AcaoAuditoriaProps) {
    super(props);
  }

  get value(): AcaoAuditoriaValue {
    return this.props.value;
  }

  get label(): string {
    return ACAO_LABELS[this.props.value];
  }

  public static create(value: string): Result<AcaoAuditoria> {
    if (!ACOES_AUDITORIA.includes(value as AcaoAuditoriaValue)) {
      return Result.fail(new Error(`Ação de auditoria inválida: "${value}"`));
    }
    return Result.ok(new AcaoAuditoria({ value: value as AcaoAuditoriaValue }));
  }

  public static reconstitute(value: AcaoAuditoriaValue): AcaoAuditoria {
    return new AcaoAuditoria({ value });
  }
}
