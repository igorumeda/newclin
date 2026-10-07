import { Mapper } from '@core/application/mapper.base';
import type { Rede } from '../../domain/entities/rede.entity';
import type { RedeOutputDto } from './rede.output.dto';

export type MapRedeParams = { rede: Rede };

export class RedeMapper extends Mapper<MapRedeParams, RedeOutputDto> {
  public map({ rede }: MapRedeParams): RedeOutputDto {
    return {
      id: rede.id.toString(),
      nome: rede.nome,
      slug: rede.slug,
      cnpj: rede.cnpj?.value ?? null,
      cnpjFormatado: rede.cnpj?.formatado ?? null,
      logotipoUrl: rede.logotipoUrl,
      tema: { preset: rede.tema.preset, cores: rede.tema.cores },
      config: rede.config,
      ativo: rede.ativo,
    };
  }
}
