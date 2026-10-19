import type { SexoValue } from '../../domain/value-objects/sexo.vo';
import type { PacienteDuplicadoDetalhe } from '../../domain/errors/paciente.errors';

export type EnderecoPacienteDto = {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
};

export type PacienteDto = {
  id: string;
  redeId: string;
  nome: string;
  nomeAbreviado: string;
  iniciais: string;
  cpf: string;
  cpfFormatado: string;
  dataNascimento: string;
  idade: number;
  menorDeIdade: boolean;
  sexo: SexoValue;
  sexoLabel: string;
  telefone: string | null;
  email: string | null;
  endereco: EnderecoPacienteDto;
  enderecoFormatado: string;
  responsavel: {
    nome: string | null;
    parentesco: string | null;
    telefone: string | null;
  };
  alergias: string | null;
  condicoesCronicas: string | null;
  observacoes: string | null;
  consentimentoLgpd: {
    concedido: boolean;
    em: string | null;
    origem: string | null;
  };
  importadoEm: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListarPacientesInputDto = {
  redeId: string;
  termo?: string | null;
  somenteAtivos?: boolean;
  unidadeId?: string | null;
  page: number;
  perPage: number;
};

export type ListarPacientesOutputDto = {
  items: PacienteDto[];
  total: number;
  page: number;
  perPage: number;
};

export type ObterPacienteInputDto = { pacienteId: string };
export type ObterPacienteOutputDto = PacienteDto;

export type CriarPacienteInputDto = {
  redeId: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: Partial<EnderecoPacienteDto>;
  /** Contato do responsável legal — campos planos alimentam `responsavel`. */
  responsavelNome?: string | null;
  responsavelCpf?: string | null;
  responsavelTelefone?: string | null;
  responsavelParentesco?: string | null;
  alergias?: string | null;
  condicoesCronicas?: string | null;
  observacoes?: string | null;
  consentimentoLgpd?: boolean;
  consentimentoOrigem?: string | null;
  /** Sobrescreve o alerta de duplicidade — usado pelo fluxo de importação. */
  ignorarDuplicidade?: boolean;
  importado?: boolean;
};

export type CriarPacienteOutputDto = PacienteDto;

export type AtualizarPacienteInputDto = Partial<Omit<CriarPacienteInputDto, 'redeId'>> & {
  pacienteId: string;
  registrarConsentimento?: boolean;
};

export type AtualizarPacienteOutputDto = PacienteDto;

export type InativarPacienteInputDto = { pacienteId: string; reativar?: boolean };
export type InativarPacienteOutputDto = PacienteDto;

export type VerificarDuplicidadeInputDto = {
  redeId: string;
  cpf?: string | null;
  nome?: string | null;
  dataNascimento?: string | null;
  ignorarId?: string | null;
};

export type VerificarDuplicidadeOutputDto = { duplicados: PacienteDuplicadoDetalhe[] };

/** Nomes usados pelo `VerificarDuplicidadePacienteUseCase`. */
export type VerificarDuplicidadePacienteInputDto = VerificarDuplicidadeInputDto;
export type VerificarDuplicidadePacienteOutputDto = VerificarDuplicidadeOutputDto;

export type LinhaImportacaoPaciente = {
  linha: number;
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  sexo?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelParentesco?: string;
  alergias?: string;
  condicoesCronicas?: string;
  observacoes?: string;
};

export type ErroImportacaoDto = {
  linha: number;
  nome: string | null;
  cpf: string | null;
  motivo: string;
};

export type RelatorioImportacaoDto = {
  totalLinhas: number;
  importados: number;
  ignorados: number;
  erros: number;
  detalhes: ErroImportacaoDto[];
  idsImportados: string[];
};

export type ImportarPacientesInputDto = {
  redeId: string;
  linhas: LinhaImportacaoPaciente[];
  consentimentoLgpd?: boolean;
  importadoPor?: string | null;
};

export type ImportarPacientesOutputDto = { relatorio: RelatorioImportacaoDto };

export type ExportarDadosPacienteInputDto = { pacienteId: string; solicitadoPor?: string | null };
export type ExportarDadosPacienteOutputDto = {
  pacienteId: string;
  geradoEm: string;
  dados: Record<string, unknown>;
};
