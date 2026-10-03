export type PacienteModel = {
  id: string;
  rede_id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo: string;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  responsavel_nome: string | null;
  responsavel_cpf: string | null;
  responsavel_telefone: string | null;
  responsavel_parentesco: string | null;
  alergias: string | null;
  condicoes_cronicas: string | null;
  observacoes: string | null;
  consentimento_lgpd: boolean;
  consentimento_lgpd_em: string | null;
  consentimento_lgpd_origem: string | null;
  importado_em: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PacienteModelData = {
  id: string;
  rede_id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo: string;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  responsavel_nome: string | null;
  responsavel_cpf: string | null;
  responsavel_telefone: string | null;
  responsavel_parentesco: string | null;
  alergias: string | null;
  condicoes_cronicas: string | null;
  observacoes: string | null;
  consentimento_lgpd: boolean;
  consentimento_lgpd_em: string | null;
  consentimento_lgpd_origem: string | null;
  importado_em: string | null;
  ativo: boolean;
};

export const PACIENTE_COLUMNS =
  'id, rede_id, nome, cpf, data_nascimento, sexo, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, uf, responsavel_nome, responsavel_cpf, responsavel_telefone, responsavel_parentesco, alergias, condicoes_cronicas, observacoes, consentimento_lgpd, consentimento_lgpd_em, consentimento_lgpd_origem, importado_em, ativo, created_at, updated_at, deleted_at';

/** Linha retornada por `verificar_paciente_duplicado`. */
export type PacienteDuplicadoModel = {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  ativo: boolean;
  motivo: string;
};

/** Linha retornada por `buscar_pacientes` (busca com paginação no banco). */
export type PacienteBuscaModel = {
  id: string;
  total_count: number;
};
