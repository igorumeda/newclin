import type { Adendo } from '../entities/adendo.entity';
import type { Atendimento } from '../entities/atendimento.entity';

export type BuscarAtendimentoParams = { redeId: string; id: string };
export type BuscarPorAgendamentoParams = { redeId: string; agendamentoId: string };
export type ListarAtendimentosParams = {
  redeId: string;
  pacienteId?: string | null;
  profissionalId?: string | null;
  unidadeId?: string | null;
  offset: number;
  limite: number;
};
export type ContarAtendimentosParams = {
  redeId: string;
  pacienteId?: string | null;
  profissionalId?: string | null;
  unidadeId?: string | null;
};
export type ListarAdendosParams = { redeId: string; atendimentoId: string };

export interface IAtendimentoRepository {
  buscarPorId(params: BuscarAtendimentoParams): Promise<Atendimento | null>;
  buscarPorAgendamento(params: BuscarPorAgendamentoParams): Promise<Atendimento | null>;
  listar(params: ListarAtendimentosParams): Promise<Atendimento[]>;
  contar(params: ContarAtendimentosParams): Promise<number>;
  listarAdendos(params: ListarAdendosParams): Promise<Adendo[]>;
  salvar(atendimento: Atendimento): Promise<void>;
  atualizar(atendimento: Atendimento): Promise<void>;
  salvarAdendo(adendo: Adendo): Promise<void>;
}

export const ATENDIMENTO_REPOSITORY = Symbol('IAtendimentoRepository');
