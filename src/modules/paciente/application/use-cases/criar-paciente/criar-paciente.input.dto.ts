import type { EnderecoPaciente } from '../../../domain/entities/paciente.entity';

export type CriarPacienteInputDto = {
  redeId: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: Partial<EnderecoPaciente>;
  responsavelNome?: string | null;
  responsavelTelefone?: string | null;
  alergias?: string[];
  condicoesCronicas?: string[];
  observacoes?: string | null;
  consentimentoLgpd?: boolean;
};
