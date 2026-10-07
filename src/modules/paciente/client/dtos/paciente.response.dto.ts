import type { EnderecoPaciente } from '../../domain/entities/paciente.entity';
import type { DetalheImportacao } from '../../domain/repositories/importacao-repository.interface';

export type PacienteResponseDto = {
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

export type LinhaImportacaoRequestDto = Record<string, string>;

export type MapeamentoColunasRequestDto = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo?: string;
  telefone?: string;
  email?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  observacoes?: string;
};

export type ImportacaoResponseDto = {
  arquivoNome: string;
  total: number;
  importados: number;
  ignorados: number;
  erros: number;
  detalhes: DetalheImportacao[];
};

export type ExportacaoPacienteResponseDto = {
  geradoEm: string;
  paciente: PacienteResponseDto;
  aviso: string;
};
