import type {
  CamposFixosAtendimento,
  DadosPreenchidos,
  FontePagadora,
  StatusAtendimento,
} from '../../domain/entities/atendimento.entity';
import type { SecaoTemplate } from '../../domain/value-objects/estrutura-template.vo';

export type TemplateResponseDto = {
  id: string;
  redeId: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  versao: number;
  secoes: SecaoTemplate[];
  totalCampos: number;
  padrao: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type AtendimentoResponseDto = {
  id: string;
  redeId: string;
  unidadeId: string;
  agendamentoId: string | null;
  pacienteId: string;
  profissionalId: string;
  templateId: string | null;
  templateVersao: number | null;
  dadosPreenchidos: DadosPreenchidos;
  camposFixos: CamposFixosAtendimento;
  fontePagadora: FontePagadora;
  status: StatusAtendimento;
  iniciadoEm: string;
  finalizadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type AdendoResponseDto = {
  id: string;
  atendimentoId: string;
  profissionalId: string;
  conteudo: string;
  criadoEm: string;
};

export type AnexoResponseDto = {
  id: string;
  redeId: string;
  pacienteId: string;
  atendimentoId: string | null;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  storageKey: string;
  descricao: string | null;
  criadoEm: string;
};

export type AtendimentoCompletoResponseDto = {
  atendimento: AtendimentoResponseDto;
  template: TemplateResponseDto | null;
  adendos: AdendoResponseDto[];
  anexos: AnexoResponseDto[];
};

export type AtendimentoIniciadoResponseDto = {
  atendimento: AtendimentoResponseDto;
  template: TemplateResponseDto | null;
  reaberto: boolean;
};
