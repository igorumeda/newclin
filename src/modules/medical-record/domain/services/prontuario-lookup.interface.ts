import type { DadosPreenchidos } from '../value-objects/dados-prontuario.vo';

export type AtendimentoResumo = {
  id: string;
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
  agendamentoId: string | null;
  status: string;
  iniciadoEm: string;
  finalizadoEm: string | null;
  queixaPrincipal: string | null;
  hipoteseDiagnostica: string | null;
  cid: string | null;
  conduta: string | null;
  anamnese: string | null;
  exameFisico: string | null;
  dadosPreenchidos: DadosPreenchidos;
  templateId: string | null;
  templateVersao: number | null;
};

export type AnexoResumo = {
  id: string;
  pacienteId: string | null;
  atendimentoId: string | null;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  storageBucket: string;
  storagePath: string;
  createdAt: string;
};

/**
 * ACL de leitura do prontuário usada pelos documentos clínicos (receita,
 * atestado, solicitação e declaração) para compor o corpo do PDF.
 */
export interface IProntuarioLookup {
  findAtendimentoById(atendimentoId: string): Promise<AtendimentoResumo | null>;
  findAtendimentoPorAgendamento(agendamentoId: string): Promise<AtendimentoResumo | null>;
  listarAtendimentosPorPaciente(params: {
    redeId: string;
    pacienteId: string;
    limite?: number;
  }): Promise<AtendimentoResumo[]>;
  listarAnexos(params: {
    redeId: string;
    pacienteId?: string | null;
    atendimentoId?: string | null;
  }): Promise<AnexoResumo[]>;
}

export const PRONTUARIO_LOOKUP = Symbol('IProntuarioLookup');
