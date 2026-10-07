import type {
  CamposFixosAtendimento,
  DadosPreenchidos,
  FontePagadora,
  StatusAtendimento,
} from '../../domain/entities/atendimento.entity';

export type AdendoOutputDto = {
  id: string;
  atendimentoId: string;
  profissionalId: string;
  conteudo: string;
  criadoEm: string;
};

export type AtendimentoOutputDto = {
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
