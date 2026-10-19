import { Mapper } from '@core/application/mapper.base';
import type { Rede } from '../../domain/entities/rede.entity';
import type { Unidade } from '../../domain/entities/unidade.entity';
import type { OrganizacaoDto, TemaDto, UnidadeDto } from '../dtos/organizacao.dto';

export type MapRedeParams = { rede: Rede };
export type MapUnidadeParams = { unidade: Unidade };

export class OrganizacaoMapper extends Mapper<MapRedeParams, OrganizacaoDto> {
  public map({ rede }: MapRedeParams): OrganizacaoDto {
    return {
      id: rede.id.toString(),
      nome: rede.nome,
      razaoSocial: rede.razaoSocial,
      cnpj: rede.cnpj,
      slug: rede.slug,
      email: rede.email,
      telefone: rede.telefone,
      tema: rede.tema.toJSON() as TemaDto,
      logotipoUrl: rede.logotipoUrl,
      logotipoPath: rede.logotipoPath,
      config: rede.config,
    };
  }
}

export class UnidadeMapper extends Mapper<MapUnidadeParams, UnidadeDto> {
  public map({ unidade }: MapUnidadeParams): UnidadeDto {
    return {
      id: unidade.id.toString(),
      redeId: unidade.redeId,
      nome: unidade.nome,
      cnes: unidade.cnes,
      cnpj: unidade.cnpj,
      telefone: unidade.telefone,
      email: unidade.email,
      endereco: unidade.endereco.toJSON(),
      enderecoFormatado: unidade.endereco.formatado(),
      timezone: unidade.timezone,
      observacoes: unidade.observacoes,
      ativo: unidade.ativo,
      createdAt: unidade.createdAt.toISOString(),
    };
  }
}
