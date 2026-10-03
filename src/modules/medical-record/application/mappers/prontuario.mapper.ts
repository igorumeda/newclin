import { Mapper } from '@core/application/mapper.base';
import { FONTE_PAGADORA_LABELS } from '../../domain/entities/atendimento.entity';
import type { Atendimento, FontePagadora, StatusAtendimento } from '../../domain/entities/atendimento.entity';
import { TIPO_EVOLUCAO_LABELS } from '../../domain/entities/evolucao.entity';
import type { Evolucao } from '../../domain/entities/evolucao.entity';
import type { Anexo } from '../../domain/entities/anexo.entity';
import { EstruturaTemplate } from '../../domain/value-objects/estrutura-template.vo';
import { TIPOS_CAMPO } from '../../domain/value-objects/campo-template.vo';
import type { TemplateProntuario } from '../../domain/entities/template-prontuario.entity';
import type { AnexoDto, AtendimentoDto, EvolucaoDto, TemplateProntuarioDto } from '../dtos/prontuario.dto';

export const STATUS_ATENDIMENTO_LABELS: Record<StatusAtendimento, string> = {
  em_andamento: 'Em andamento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

export type EnriquecimentoAtendimento = {
  pacienteNome: string | null;
  profissionalNome: string | null;
  unidadeNome: string | null;
  templateNome: string | null;
};

const ENRIQUECIMENTO_VAZIO: EnriquecimentoAtendimento = {
  pacienteNome: null,
  profissionalNome: null,
  unidadeNome: null,
  templateNome: null,
};

export type MapTemplateParams = { template: TemplateProntuario };

export class TemplateProntuarioMapper extends Mapper<MapTemplateParams, TemplateProntuarioDto> {
  public map({ template }: MapTemplateParams): TemplateProntuarioDto {
    return {
      id: template.id.toString(),
      redeId: template.redeId,
      nome: template.nome,
      especialidade: template.especialidade,
      descricao: template.descricao,
      estrutura: template.estrutura.toJSON(),
      totalCampos: template.estrutura.campos().length,
      tiposDisponiveis: TIPOS_CAMPO,
      versao: template.versao,
      origem: template.origem,
      templateBaseId: template.templateBaseId,
      isPadrao: template.isPadrao,
      ativo: template.ativo,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}

export type MapAtendimentoParams = {
  atendimento: Atendimento;
  enriquecimento?: Partial<EnriquecimentoAtendimento>;
};

export class AtendimentoMapper extends Mapper<MapAtendimentoParams, AtendimentoDto> {
  public map({ atendimento, enriquecimento }: MapAtendimentoParams): AtendimentoDto {
    const dados = { ...ENRIQUECIMENTO_VAZIO, ...(enriquecimento ?? {}) };

    return {
      id: atendimento.id.toString(),
      redeId: atendimento.redeId,
      unidadeId: atendimento.unidadeId,
      unidadeNome: dados.unidadeNome,
      agendamentoId: atendimento.agendamentoId,
      pacienteId: atendimento.pacienteId,
      pacienteNome: dados.pacienteNome,
      profissionalId: atendimento.profissionalId,
      profissionalNome: dados.profissionalNome,
      templateId: atendimento.templateId,
      templateVersao: atendimento.templateVersao,
      templateNome: dados.templateNome,
      tipoAtendimentoId: atendimento.tipoAtendimentoId,
      queixaPrincipal: atendimento.queixaPrincipal,
      anamnese: atendimento.anamnese,
      exameFisico: atendimento.exameFisico,
      hipoteseDiagnostica: atendimento.hipoteseDiagnostica,
      cid: atendimento.cid,
      conduta: atendimento.conduta,
      dadosPreenchidos: atendimento.dadosPreenchidos.toJSON(),
      fontePagadora: atendimento.fontePagadora,
      fontePagadoraLabel: FONTE_PAGADORA_LABELS[atendimento.fontePagadora as FontePagadora],
      status: atendimento.status,
      statusLabel: STATUS_ATENDIMENTO_LABELS[atendimento.status],
      iniciadoEm: atendimento.iniciadoEm.toISOString(),
      finalizadoEm: atendimento.finalizadoEm ? atendimento.finalizadoEm.toISOString() : null,
      finalizadoPor: atendimento.finalizadoPor,
      finalizado: atendimento.estaFinalizado(),
      createdAt: atendimento.createdAt.toISOString(),
    };
  }
}

export type MapEvolucaoParams = { evolucao: Evolucao };

export class EvolucaoMapper extends Mapper<MapEvolucaoParams, EvolucaoDto> {
  public map({ evolucao }: MapEvolucaoParams): EvolucaoDto {
    return {
      id: evolucao.id.toString(),
      atendimentoId: evolucao.atendimentoId,
      pacienteId: evolucao.pacienteId,
      profissionalId: evolucao.profissionalId,
      tipo: evolucao.tipo,
      tipoLabel: TIPO_EVOLUCAO_LABELS[evolucao.tipo],
      conteudo: evolucao.conteudo,
      dados: evolucao.dados,
      assinadoEm: evolucao.assinadoEm.toISOString(),
      createdAt: evolucao.createdAt.toISOString(),
    };
  }
}

export type MapAnexoParams = { anexo: Anexo; urlAssinada?: string | null; expiraEm?: string | null };

export class AnexoMapper extends Mapper<MapAnexoParams, AnexoDto> {
  public map({ anexo, urlAssinada = null, expiraEm = null }: MapAnexoParams): AnexoDto {
    return {
      id: anexo.id.toString(),
      pacienteId: anexo.pacienteId,
      atendimentoId: anexo.atendimentoId,
      nomeArquivo: anexo.nomeArquivo,
      descricao: anexo.descricao,
      mimeType: anexo.mimeType,
      tamanhoBytes: anexo.tamanhoBytes,
      tamanhoFormatado: this.formatarTamanho(anexo.tamanhoBytes),
      storageBucket: anexo.storageBucket,
      storagePath: anexo.storagePath,
      urlAssinada,
      expiraEm,
      createdAt: anexo.createdAt.toISOString(),
    };
  }

  private formatarTamanho(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/** Estrutura vazia usada quando o atendimento não tem template associado. */
export function estruturaVazia(): EstruturaTemplate {
  return EstruturaTemplate.reconstitute({ secoes: [] });
}
