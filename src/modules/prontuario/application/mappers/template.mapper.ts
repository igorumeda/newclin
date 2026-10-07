import { Mapper } from '@core/application/mapper.base';
import type { TemplateProntuario } from '../../domain/entities/template-prontuario.entity';
import type { TemplateOutputDto } from './template.output.dto';

export type TemplateMapperParams = { template: TemplateProntuario };

export class TemplateMapper extends Mapper<TemplateMapperParams, TemplateOutputDto> {
  public map({ template }: TemplateMapperParams): TemplateOutputDto {
    return {
      id: template.id.toString(),
      redeId: template.redeId,
      nome: template.nome,
      especialidade: template.especialidade,
      descricao: template.descricao,
      versao: template.versao,
      secoes: template.estrutura.secoes,
      totalCampos: template.estrutura.totalCampos,
      padrao: template.padrao,
      ativo: template.ativo,
      criadoEm: template.createdAt.toISOString(),
      atualizadoEm: template.updatedAt.toISOString(),
    };
  }
}
