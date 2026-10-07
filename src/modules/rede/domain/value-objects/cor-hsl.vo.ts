import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type CorHslValue = string;
export type CorHslProps = { value: CorHslValue };

/** Formato aceito: "H S% L%" (o mesmo usado pelos design tokens em CSS). */
const HSL_PATTERN = /^\d{1,3}(\.\d+)?\s+\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?%$/;

export class CorHsl extends ValueObject<CorHslProps> {
  private constructor(props: CorHslProps) {
    super(props);
  }

  get value(): CorHslValue {
    return this.props.value;
  }

  public static create(cor: CorHslValue): Result<CorHsl> {
    const normalized = (cor ?? '').trim().replace(/\s+/g, ' ');
    if (!HSL_PATTERN.test(normalized)) {
      return Result.fail(new Error(`Cor inválida: "${cor}". Use o formato "210 40% 96%".`));
    }
    return Result.ok(new CorHsl({ value: normalized }));
  }

  public static reconstitute(value: CorHslValue): CorHsl {
    return new CorHsl({ value });
  }
}
