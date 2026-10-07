import { Mapper } from '@core/application/mapper.base';
import type { Paciente } from '../../domain/entities/paciente.entity';
import type { PacienteOutputDto } from './paciente.output.dto';

export type MapPacienteParams = { paciente: Paciente };

export class PacienteMapper extends Mapper<MapPacienteParams, PacienteOutputDto> {
  public map({ paciente }: MapPacienteParams): PacienteOutputDto {
    return {
      id: paciente.id.toString(),
      redeId: paciente.redeId,
      nome: paciente.nome,
      cpf: paciente.cpf.value,
      cpfFormatado: paciente.cpf.formatado,
      dataNascimento: paciente.dataNascimento.iso,
      idade: paciente.idade,
      menorDeIdade: paciente.isMenorDeIdade,
      sexo: paciente.sexo.value,
      rotuloSexo: paciente.sexo.rotulo,
      telefone: paciente.telefone?.value ?? null,
      telefoneFormatado: paciente.telefone?.formatado ?? null,
      email: paciente.email,
      endereco: paciente.endereco,
      responsavelNome: paciente.responsavelNome,
      responsavelTelefone: paciente.responsavelTelefone?.formatado ?? null,
      alergias: paciente.alergias,
      condicoesCronicas: paciente.condicoesCronicas,
      observacoes: paciente.observacoes,
      consentimentoLgpd: paciente.consentimentoLgpd,
      consentimentoEm: paciente.consentimentoEm?.toISOString() ?? null,
      ativo: paciente.ativo,
      criadoEm: paciente.createdAt.toISOString(),
    };
  }
}
