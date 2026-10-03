import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { TemplateProntuario } from '../../../../domain/entities/template-prontuario.entity';
import type { OrigemTemplate } from '../../../../domain/entities/template-prontuario.entity';
import { Atendimento } from '../../../../domain/entities/atendimento.entity';
import type { FontePagadora, StatusAtendimento } from '../../../../domain/entities/atendimento.entity';
import { Evolucao } from '../../../../domain/entities/evolucao.entity';
import type { TipoEvolucao } from '../../../../domain/entities/evolucao.entity';
import { Anexo } from '../../../../domain/entities/anexo.entity';
import { EstruturaTemplate } from '../../../../domain/value-objects/estrutura-template.vo';
import { DadosProntuario } from '../../../../domain/value-objects/dados-prontuario.vo';
import type {
  AnexoModel,
  AnexoModelData,
  AtendimentoModel,
  AtendimentoModelData,
  EvolucaoModel,
  EvolucaoModelData,
  TemplateProntuarioModel,
  TemplateProntuarioModelData,
} from '../models/prontuario.model';

export class TemplateProntuarioPersistenceMapper extends PersistenceMapper<
  TemplateProntuario,
  TemplateProntuarioModel,
  TemplateProntuarioModelData
> {
  public toDomain({ record }: ToDomainParams<TemplateProntuarioModel>): TemplateProntuario {
    return TemplateProntuario.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        especialidade: record.especialidade,
        descricao: record.descricao,
        estrutura: EstruturaTemplate.reconstitute(record.estrutura),
        versao: record.versao,
        origem: record.origem as OrigemTemplate,
        templateBaseId: record.template_base_id,
        isPadrao: record.is_padrao,
        ativo: record.ativo,
        createdBy: record.created_by,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<TemplateProntuario>): TemplateProntuarioModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      especialidade: entity.especialidade,
      descricao: entity.descricao,
      estrutura: entity.estrutura.toJSON(),
      versao: entity.versao,
      origem: entity.origem,
      template_base_id: entity.templateBaseId,
      is_padrao: entity.isPadrao,
      ativo: entity.ativo,
      created_by: entity.createdBy,
    };
  }
}

export class AtendimentoPersistenceMapper extends PersistenceMapper<
  Atendimento,
  AtendimentoModel,
  AtendimentoModelData
> {
  public toDomain({ record }: ToDomainParams<AtendimentoModel>): Atendimento {
    return Atendimento.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        unidadeId: record.unidade_id,
        agendamentoId: record.agendamento_id,
        pacienteId: record.paciente_id,
        profissionalId: record.profissional_id,
        templateId: record.template_id,
        templateVersao: record.template_versao,
        tipoAtendimentoId: record.tipo_atendimento_id,
        queixaPrincipal: record.queixa_principal,
        anamnese: record.anamnese,
        exameFisico: record.exame_fisico,
        hipoteseDiagnostica: record.hipotese_diagnostica,
        cid: record.cid,
        conduta: record.conduta,
        dadosPreenchidos: DadosProntuario.reconstitute(record.dados_preenchidos ?? {}),
        fontePagadora: record.fonte_pagadora as FontePagadora,
        status: record.status as StatusAtendimento,
        iniciadoEm: new Date(record.iniciado_em),
        finalizadoEm: record.finalizado_em ? new Date(record.finalizado_em) : null,
        finalizadoPor: record.finalizado_por,
        canceladoEm: record.cancelado_em ? new Date(record.cancelado_em) : null,
        motivoCancelamento: record.motivo_cancelamento,
        createdBy: record.created_by,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Atendimento>): AtendimentoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      unidade_id: entity.unidadeId,
      agendamento_id: entity.agendamentoId,
      paciente_id: entity.pacienteId,
      profissional_id: entity.profissionalId,
      template_id: entity.templateId,
      template_versao: entity.templateVersao,
      tipo_atendimento_id: entity.tipoAtendimentoId,
      queixa_principal: entity.queixaPrincipal,
      anamnese: entity.anamnese,
      exame_fisico: entity.exameFisico,
      hipotese_diagnostica: entity.hipoteseDiagnostica,
      cid: entity.cid,
      conduta: entity.conduta,
      dados_preenchidos: entity.dadosPreenchidos.toJSON(),
      fonte_pagadora: entity.fontePagadora,
      status: entity.status,
      iniciado_em: entity.iniciadoEm.toISOString(),
      finalizado_em: entity.finalizadoEm ? entity.finalizadoEm.toISOString() : null,
      finalizado_por: entity.finalizadoPor,
      cancelado_em: entity.canceladoEm ? entity.canceladoEm.toISOString() : null,
      motivo_cancelamento: entity.motivoCancelamento,
      created_by: entity.createdBy,
    };
  }
}

export class EvolucaoPersistenceMapper extends PersistenceMapper<
  Evolucao,
  EvolucaoModel,
  EvolucaoModelData
> {
  public toDomain({ record }: ToDomainParams<EvolucaoModel>): Evolucao {
    return Evolucao.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.created_at),
      props: {
        redeId: record.rede_id,
        atendimentoId: record.atendimento_id,
        pacienteId: record.paciente_id,
        profissionalId: record.profissional_id,
        tipo: record.tipo as TipoEvolucao,
        conteudo: record.conteudo,
        dados: record.dados ?? {},
        assinadoEm: new Date(record.assinado_em),
        createdBy: record.created_by,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Evolucao>): EvolucaoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      atendimento_id: entity.atendimentoId,
      paciente_id: entity.pacienteId,
      profissional_id: entity.profissionalId,
      tipo: entity.tipo,
      conteudo: entity.conteudo,
      dados: entity.dados,
      assinado_em: entity.assinadoEm.toISOString(),
      created_by: entity.createdBy,
    };
  }
}

export class AnexoPersistenceMapper extends PersistenceMapper<Anexo, AnexoModel, AnexoModelData> {
  public toDomain({ record }: ToDomainParams<AnexoModel>): Anexo {
    return Anexo.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        pacienteId: record.paciente_id,
        atendimentoId: record.atendimento_id,
        nomeArquivo: record.nome_arquivo,
        descricao: record.descricao,
        mimeType: record.mime_type,
        tamanhoBytes: Number(record.tamanho_bytes),
        storageBucket: record.storage_bucket,
        storagePath: record.storage_path,
        uploadedBy: record.uploaded_by,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Anexo>): AnexoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      paciente_id: entity.pacienteId,
      atendimento_id: entity.atendimentoId,
      nome_arquivo: entity.nomeArquivo,
      descricao: entity.descricao,
      mime_type: entity.mimeType,
      tamanho_bytes: entity.tamanhoBytes,
      storage_bucket: entity.storageBucket,
      storage_path: entity.storagePath,
      uploaded_by: entity.uploadedBy,
    };
  }
}
