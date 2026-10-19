import { Mapper } from '@core/application/mapper.base';
import type { Paciente } from '../../domain/entities/paciente.entity';
import type { PacienteResumo } from '../../domain/services/paciente-lookup.interface';
import type { PacienteDto } from '../dtos/paciente.dto';

export type MapPacienteParams = { paciente: Paciente; referencia?: Date };

export class PacienteMapper extends Mapper<MapPacienteParams, PacienteDto> {
  public map({ paciente, referencia }: MapPacienteParams): PacienteDto {
    return {
      id: paciente.id.toString(),
      redeId: paciente.redeId,
      nome: paciente.nome.valor,
      nomeAbreviado: this.abreviar(paciente.nome.valor),
      iniciais: paciente.nome.iniciais(),
      cpf: paciente.cpf.valor,
      cpfFormatado: paciente.cpf.formatado(),
      dataNascimento: paciente.dataNascimento.paraISO(),
      idade: paciente.idade(referencia),
      menorDeIdade: paciente.isMenorDeIdade(referencia),
      sexo: paciente.sexo.valor,
      sexoLabel: paciente.sexo.label,
      telefone: paciente.contato.telefone,
      email: paciente.contato.email,
      endereco: paciente.endereco.toJSON(),
      enderecoFormatado: paciente.endereco.formatado(),
      responsavel: {
        nome: paciente.responsavel.nome,
        parentesco: paciente.responsavel.parentesco,
        telefone: paciente.responsavel.telefone,
      },
      alergias: paciente.alergias,
      condicoesCronicas: paciente.condicoesCronicas,
      observacoes: paciente.observacoes,
      consentimentoLgpd: {
        concedido: paciente.consentimentoLgpd.concedido,
        em: paciente.consentimentoLgpd.em ? paciente.consentimentoLgpd.em.toISOString() : null,
        origem: paciente.consentimentoLgpd.origem,
      },
      importadoEm: paciente.importadoEm ? paciente.importadoEm.toISOString() : null,
      ativo: paciente.ativo,
      createdAt: paciente.createdAt.toISOString(),
      updatedAt: paciente.updatedAt.toISOString(),
    };
  }

  private abreviar(nome: string): string {
    const partes = nome.split(' ').filter(Boolean);
    if (partes.length <= 2) return nome;
    return `${partes[0]} ${partes[1][0]}. ${partes[partes.length - 1]}`;
  }
}

/** Linha de lista/tabela e ACL de leitura: sem dados clínicos. */
export function toPacienteResumo(paciente: Paciente, referencia?: Date): PacienteResumo {
  return {
    id: paciente.id.toString(),
    redeId: paciente.redeId,
    nome: paciente.nome.valor,
    nomeAbreviado: paciente.nome.iniciais(),
    cpf: paciente.cpf.valor,
    cpfFormatado: paciente.cpf.formatado(),
    dataNascimento: paciente.dataNascimento.paraISO(),
    sexo: paciente.sexo.valor,
    sexoLabel: paciente.sexo.label,
    idade: paciente.idade(referencia),
    menorDeIdade: paciente.isMenorDeIdade(referencia),
    telefone: paciente.contato.telefone,
    email: paciente.contato.email,
    responsavelNome: paciente.responsavel.nome,
    ativo: paciente.ativo,
  };
}
