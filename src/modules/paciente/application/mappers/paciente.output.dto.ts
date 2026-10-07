import type { EnderecoPaciente } from '../../domain/entities/paciente.entity';

export type PacienteOutputDto = {
  id: string;
  redeId: string;
  nome: string;
  cpf: string;
  cpfFormatado: string;
  dataNascimento: string;
  idade: number;
  menorDeIdade: boolean;
  sexo: string;
  rotuloSexo: string;
  telefone: string | null;
  telefoneFormatado: string | null;
  email: string | null;
  endereco: EnderecoPaciente;
  responsavelNome: string | null;
  responsavelTelefone: string | null;
  alergias: string[];
  condicoesCronicas: string[];
  observacoes: string | null;
  consentimentoLgpd: boolean;
  consentimentoEm: string | null;
  ativo: boolean;
  criadoEm: string;
};
