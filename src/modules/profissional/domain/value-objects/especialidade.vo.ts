import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type EspecialidadeValue = string;
export type EspecialidadeProps = { value: EspecialidadeValue };

/** Especialidades com template padrão fornecido pelo sistema (spec §3.5). */
export const ESPECIALIDADES_PADRAO = [
  'Clínica Geral',
  'Pediatria',
  'Ginecologia',
  'Ortopedia',
  'Dermatologia',
  'Cardiologia',
  'Psiquiatria',
] as const;

export class Especialidade extends ValueObject<EspecialidadeProps> {
  private constructor(props: EspecialidadeProps) {
    super(props);
  }

  get value(): EspecialidadeValue {
    return this.props.value;
  }

  public static create(especialidade: EspecialidadeValue): Result<Especialidade> {
    const normalized = (especialidade ?? '').trim();
    if (normalized.length < 3) {
      return Result.fail(new Error('Especialidade deve ter no mínimo 3 caracteres'));
    }
    if (normalized.length > 80) {
      return Result.fail(new Error('Especialidade muito longa'));
    }
    return Result.ok(new Especialidade({ value: normalized }));
  }

  public static reconstitute(value: EspecialidadeValue): Especialidade {
    return new Especialidade({ value });
  }
}
