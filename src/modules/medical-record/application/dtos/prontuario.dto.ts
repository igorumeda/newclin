import type { CampoEstrutura, TipoCampoTemplate } from '../../domain/value-objects/campo-template.vo';
import type { SecaoEstrutura, SecaoEstruturaNormalizada } from '../../domain/value-objects/estrutura-template.vo';
import type { DadosPreenchidos } from '../../domain/value-objects/dados-prontuario.vo';
import type { FontePagadora, StatusAtendimento } from '../../domain/entities/atendimento.entity';
import type { OrigemTemplate } from '../../domain/entities/template-prontuario.entity';
import type { TipoEvolucao } from '../../domain/entities/evolucao.entity';

// ── Templates ───────────────────────────────────────────────────────────────
export type TemplateProntuarioDto = {
  id: string;
  redeId: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  estrutura: { secoes: SecaoEstruturaNormalizada[] };
  totalCampos: number;
  tiposDisponiveis: TipoCampoTemplate[];
  versao: number;
  origem: OrigemTemplate;
  templateBaseId: string | null;
  isPadrao: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListarTemplatesInputDto = {
  redeId: string;
  especialidade?: string | null;
  busca?: string | null;
  somenteAtivos?: boolean;
};

export type ListarTemplatesOutputDto = { items: TemplateProntuarioDto[]; especialidades: string[] };

export type ObterTemplateInputDto = { templateId: string };
export type ObterTemplateOutputDto = TemplateProntuarioDto;

export type CriarTemplateInputDto = {
  redeId: string;
  nome: string;
  especialidade: string;
  descricao?: string | null;
  secoes: SecaoEstrutura[];
  createdBy?: string | null;
};

export type CriarTemplateOutputDto = TemplateProntuarioDto;

export type ClonarTemplateInputDto = {
  templateId: string;
  redeId: string;
  nome: string;
  especialidade?: string;
  createdBy?: string | null;
};

export type ClonarTemplateOutputDto = TemplateProntuarioDto;

export type AtualizarTemplateInputDto = {
  templateId: string;
  nome?: string;
  especialidade?: string;
  descricao?: string | null;
  secoes?: SecaoEstrutura[];
};

export type AtualizarTemplateOutputDto = TemplateProntuarioDto;

export type InativarTemplateInputDto = { templateId: string; reativar?: boolean };
export type InativarTemplateOutputDto = TemplateProntuarioDto;

// ── Atendimentos ────────────────────────────────────────────────────────────
export type EvolucaoDto = {
  id: string;
  atendimentoId: string;
  pacienteId: string;
  profissionalId: string;
  tipo: TipoEvolucao;
  tipoLabel: string;
  conteudo: string;
  dados: DadosPreenchidos;
  assinadoEm: string;
  createdAt: string;
};

export type AtendimentoDto = {
  id: string;
  redeId: string;
  unidadeId: string;
  unidadeNome: string | null;
  agendamentoId: string | null;
  pacienteId: string;
  pacienteNome: string | null;
  profissionalId: string;
  profissionalNome: string | null;
  templateId: string | null;
  templateVersao: number | null;
  templateNome: string | null;
  tipoAtendimentoId: string | null;
  queixaPrincipal: string | null;
  anamnese: string | null;
  exameFisico: string | null;
  hipoteseDiagnostica: string | null;
  cid: string | null;
  conduta: string | null;
  dadosPreenchidos: DadosPreenchidos;
  fontePagadora: FontePagadora;
  fontePagadoraLabel: string;
  status: StatusAtendimento;
  statusLabel: string;
  iniciadoEm: string;
  finalizadoEm: string | null;
  finalizadoPor: string | null;
  finalizado: boolean;
  createdAt: string;
};

export type IniciarAtendimentoInputDto = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
  agendamentoId?: string | null;
  tipoAtendimentoId?: string | null;
  templateId?: string | null;
  /** Usada para escolher o template padrão da especialidade quando não informado. */
  especialidade?: string | null;
  fontePagadora?: FontePagadora;
  camposFixos?: {
    queixaPrincipal?: string | null;
    anamnese?: string | null;
    exameFisico?: string | null;
    hipoteseDiagnostica?: string | null;
    cid?: string | null;
    conduta?: string | null;
  };
  createdBy?: string | null;
};

export type IniciarAtendimentoOutputDto = AtendimentoDto;

export type ObterAtendimentoInputDto = {
  atendimentoId: string;
  usuarioId: string;
};

export type ObterAtendimentoOutputDto = {
  atendimento: AtendimentoDto;
  evolucoes: EvolucaoDto[];
  /** Estrutura do template usado — permite renderizar o formulário do histórico. */
  estrutura: { secoes: SecaoEstruturaNormalizada[] } | null;
  camposFixos: CampoEstrutura[];
};

export type SalvarRascunhoInputDto = {
  atendimentoId: string;
  camposFixos?: {
    queixaPrincipal?: string | null;
    anamnese?: string | null;
    exameFisico?: string | null;
    hipoteseDiagnostica?: string | null;
    cid?: string | null;
    conduta?: string | null;
  };
  dadosPreenchidos?: DadosPreenchidos;
  fontePagadora?: FontePagadora;
  templateId?: string | null;
};

export type SalvarRascunhoOutputDto = { atendimento: AtendimentoDto; avisos: string[] };

export type FinalizarAtendimentoInputDto = { atendimentoId: string; usuarioId: string };
export type FinalizarAtendimentoOutputDto = AtendimentoDto;

export type CancelarAtendimentoInputDto = { atendimentoId: string; motivo: string };
export type CancelarAtendimentoOutputDto = AtendimentoDto;

export type AdicionarAdendoInputDto = {
  atendimentoId: string;
  conteudo: string;
  tipo?: TipoEvolucao;
  dados?: DadosPreenchidos;
  autorId?: string | null;
};

export type AdicionarAdendoOutputDto = EvolucaoDto;

export type ListarAtendimentosInputDto = {
  redeId: string;
  pacienteId?: string | null;
  profissionalId?: string | null;
  unidadeId?: string | null;
  de?: string | null;
  ate?: string | null;
  status?: StatusAtendimento[] | null;
  page?: number;
  perPage?: number;
};

export type ListarAtendimentosOutputDto = { items: AtendimentoDto[]; total: number };

// ── Anexos ──────────────────────────────────────────────────────────────────
export type AnexoDto = {
  id: string;
  pacienteId: string | null;
  atendimentoId: string | null;
  nomeArquivo: string;
  descricao: string | null;
  mimeType: string;
  tamanhoBytes: number;
  tamanhoFormatado: string;
  storageBucket: string;
  storagePath: string;
  urlAssinada: string | null;
  expiraEm: string | null;
  createdAt: string;
};

export type EnviarAnexoInputDto = {
  redeId: string;
  pacienteId: string;
  atendimentoId?: string | null;
  nomeArquivo: string;
  descricao?: string | null;
  mimeType: string;
  tamanhoBytes: number;
  conteudoBase64: string;
  uploadedBy?: string | null;
};

export type EnviarAnexoOutputDto = AnexoDto;

export type ListarAnexosInputDto = {
  redeId: string;
  pacienteId?: string | null;
  atendimentoId?: string | null;
};

export type ListarAnexosOutputDto = { items: AnexoDto[] };

export type RemoverAnexoInputDto = { anexoId: string };
export type RemoverAnexoOutputDto = { anexoId: string };

export type ObterLinkAnexoInputDto = { anexoId: string; expiraEmSegundos?: number };
export type ObterLinkAnexoOutputDto = { anexoId: string; url: string | null; expiraEm: string | null };
