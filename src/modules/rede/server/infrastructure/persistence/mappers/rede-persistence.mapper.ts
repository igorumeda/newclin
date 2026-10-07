import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Rede, CONFIG_PADRAO } from '../../../../domain/entities/rede.entity';
import type { RedeConfig } from '../../../../domain/entities/rede.entity';
import { Cnpj } from '../../../../domain/value-objects/cnpj.vo';
import { Tema, TEMA_PADRAO } from '../../../../domain/value-objects/tema.vo';
import type { TemaCores } from '../../../../domain/value-objects/tema.vo';
import type { RedeModel, RedeModelData } from '../models/rede.model';

export type RedeToDomainParams = ToDomainParams<RedeModel>;
export type RedeToPersistenceParams = ToPersistenceParams<Rede>;

export class RedePersistenceMapper extends PersistenceMapper<Rede, RedeModel, RedeModelData> {
  toDomain({ record }: RedeToDomainParams): Rede {
    const temaBruto = (record.tema ?? {}) as { preset?: string; cores?: Partial<TemaCores> };
    return Rede.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        nome: record.nome,
        slug: record.slug,
        cnpj: record.cnpj ? Cnpj.reconstitute(record.cnpj) : null,
        logotipoUrl: record.logotipo_url,
        tema: Tema.reconstitute({
          preset: temaBruto.preset ?? 'azul_saude',
          cores: { ...TEMA_PADRAO, ...(temaBruto.cores ?? {}) },
        }),
        config: { ...CONFIG_PADRAO, ...((record.config ?? {}) as Partial<RedeConfig>) },
        ativo: record.ativo,
      },
    });
  }

  toPersistence({ entity }: RedeToPersistenceParams): RedeModelData {
    return {
      id: entity.id.toString(),
      nome: entity.nome,
      slug: entity.slug,
      cnpj: entity.cnpj?.value ?? null,
      logotipo_url: entity.logotipoUrl,
      tema: JSON.stringify({ preset: entity.tema.preset, cores: entity.tema.cores }),
      config: JSON.stringify(entity.config),
      ativo: entity.ativo,
    };
  }
}
