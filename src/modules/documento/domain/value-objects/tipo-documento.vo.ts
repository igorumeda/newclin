import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export const TIPOS_DOCUMENTO = [
  'receita',
  'atestado',
  'solicitacao_exames',
  'declaracao_comparecimento',
] as const;

export type TipoDocumentoValue = (typeof TIPOS_DOCUMENTO)[number];
export type TipoDocumentoProps = { value: TipoDocumentoValue };

export const ROTULO_TIPO_DOCUMENTO: Record<TipoDocumentoValue, string> = {
  receita: 'Receita',
  atestado: 'Atestado',
  solicitacao_exames: 'Solicitação de exames',
  declaracao_comparecimento: 'Declaração de comparecimento',
};

/** Campos obrigatórios do conteúdo de cada tipo (spec §3.6). */
export const CAMPOS_OBRIGATORIOS_POR_TIPO: Record<TipoDocumentoValue, string[]> = {
  receita: ['medicamentos'],
  atestado: ['diasAfastamento'],
  solicitacao_exames: ['exames'],
  declaracao_comparecimento: ['horaChegada', 'horaSaida'],
};

export class TipoDocumento extends ValueObject<TipoDocumentoProps> {
  private constructor(props: TipoDocumentoProps) {
    super(props);
  }

  get value(): TipoDocumentoValue {
    return this.props.value;
  }

  get rotulo(): string {
    return ROTULO_TIPO_DOCUMENTO[this.props.value];
  }

  get camposObrigatorios(): string[] {
    return CAMPOS_OBRIGATORIOS_POR_TIPO[this.props.value];
  }

  public static create(tipo: string): Result<TipoDocumento> {
    if (!TIPOS_DOCUMENTO.includes(tipo as TipoDocumentoValue)) {
      return Result.fail(new Error(`Tipo de documento inválido: ${tipo}`));
    }
    return Result.ok(new TipoDocumento({ value: tipo as TipoDocumentoValue }));
  }

  public static reconstitute(value: TipoDocumentoValue): TipoDocumento {
    return new TipoDocumento({ value });
  }
}
