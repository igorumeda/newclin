import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Paciente } from '../../../../domain/entities/paciente.entity';
import { Cpf } from '../../../../domain/value-objects/cpf.vo';
import { NomeCompleto } from '../../../../domain/value-objects/nome-completo.vo';
import { DataNascimento } from '../../../../domain/value-objects/data-nascimento.vo';
import { Sexo } from '../../../../domain/value-objects/sexo.vo';
import type { SexoValue } from '../../../../domain/value-objects/sexo.vo';
import { Contato } from '../../../../domain/value-objects/contato.vo';
import { Endereco } from '../../../../domain/value-objects/endereco.vo';
import { Responsavel } from '../../../../domain/value-objects/responsavel.vo';
import type { PacienteModel, PacienteModelData } from '../models/paciente.model';

export class PacientePersistenceMapper extends PersistenceMapper<
  Paciente,
  PacienteModel,
  PacienteModelData
> {
  public toDomain({ record }: ToDomainParams<PacienteModel>): Paciente {
    return Paciente.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        nome: NomeCompleto.reconstitute(record.nome),
        cpf: Cpf.reconstitute(record.cpf),
        dataNascimento: DataNascimento.reconstitute(record.data_nascimento),
        sexo: Sexo.reconstitute(record.sexo as SexoValue),
        contato: Contato.reconstitute({ telefone: record.telefone, email: record.email }),
        endereco: Endereco.reconstitute({
          cep: record.cep,
          logradouro: record.logradouro,
          numero: record.numero,
          complemento: record.complemento,
          bairro: record.bairro,
          cidade: record.cidade,
          uf: record.uf,
        }),
        responsavel: Responsavel.reconstitute({
          nome: record.responsavel_nome,
          cpf: record.responsavel_cpf,
          telefone: record.responsavel_telefone,
          parentesco: record.responsavel_parentesco,
        }),
        alergias: record.alergias,
        condicoesCronicas: record.condicoes_cronicas,
        observacoes: record.observacoes,
        consentimentoLgpd: {
          concedido: record.consentimento_lgpd,
          em: record.consentimento_lgpd_em ? new Date(record.consentimento_lgpd_em) : null,
          origem: record.consentimento_lgpd_origem,
        },
        importadoEm: record.importado_em ? new Date(record.importado_em) : null,
        ativo: record.ativo,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Paciente>): PacienteModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome.valor,
      cpf: entity.cpf.valor,
      data_nascimento: entity.dataNascimento.paraISO(),
      sexo: entity.sexo.valor,
      telefone: entity.contato.telefone,
      email: entity.contato.email,
      cep: entity.endereco.cep,
      logradouro: entity.endereco.logradouro,
      numero: entity.endereco.numero,
      complemento: entity.endereco.complemento,
      bairro: entity.endereco.bairro,
      cidade: entity.endereco.cidade,
      uf: entity.endereco.uf,
      responsavel_nome: entity.responsavel.nome,
      responsavel_cpf: entity.responsavel.cpf,
      responsavel_telefone: entity.responsavel.telefone,
      responsavel_parentesco: entity.responsavel.parentesco,
      alergias: entity.alergias,
      condicoes_cronicas: entity.condicoesCronicas,
      observacoes: entity.observacoes,
      consentimento_lgpd: entity.consentimentoLgpd.concedido,
      consentimento_lgpd_em: entity.consentimentoLgpd.em
        ? entity.consentimentoLgpd.em.toISOString()
        : null,
      consentimento_lgpd_origem: entity.consentimentoLgpd.origem,
      importado_em: entity.importadoEm ? entity.importadoEm.toISOString() : null,
      ativo: entity.ativo,
    };
  }
}
