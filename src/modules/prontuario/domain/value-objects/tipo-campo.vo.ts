import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

/** Os 9 tipos de campo suportados pelo motor de templates (spec §3.5). */
export const TIPOS_CAMPO = [
  'texto_curto',
  'texto_longo',
  'numero',
  'data',
  'selecao_unica',
  'selecao_multipla',
  'escala',
  'sim_nao',
  'anexo',
] as const;

export type TipoCampoValue = (typeof TIPOS_CAMPO)[number];
export type TipoCampoProps = { value: TipoCampoValue };

export const ROTULO_TIPO_CAMPO: Record<TipoCampoValue, string> = {
  texto_curto: 'Texto curto',
  texto_longo: 'Texto longo',
  numero: 'Número',
  data: 'Data',
  selecao_unica: 'Seleção única',
  selecao_multipla: 'Seleção múltipla',
  escala: 'Escala 1–10',
  sim_nao: 'Sim/Não',
  anexo: 'Anexo',
};

export const TIPOS_COM_OPCOES: TipoCampoValue[] = ['selecao_unica', 'selecao_multipla'];

export const ESCALA_MINIMA = 1;
export const ESCALA_MAXIMA = 10;

export class TipoCampo extends ValueObject<TipoCampoProps> {
  private constructor(props: TipoCampoProps) {
    super(props);
  }

  get value(): TipoCampoValue {
    return this.props.value;
  }

  get rotulo(): string {
    return ROTULO_TIPO_CAMPO[this.props.value];
  }

  get exigeOpcoes(): boolean {
    return TIPOS_COM_OPCOES.includes(this.props.value);
  }

  public static create(tipo: string): Result<TipoCampo> {
    if (!TIPOS_CAMPO.includes(tipo as TipoCampoValue)) {
      return Result.fail(new Error(`Tipo de campo inválido: ${tipo}`));
    }
    return Result.ok(new TipoCampo({ value: tipo as TipoCampoValue }));
  }

  public static reconstitute(value: TipoCampoValue): TipoCampo {
    return new TipoCampo({ value });
  }
}
