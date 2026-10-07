import type { Paciente } from '../entities/paciente.entity';
import type { Cpf } from '../value-objects/cpf.vo';
import type { DataNascimento } from '../value-objects/data-nascimento.vo';

export type PacienteId = string;
export type BuscarPacienteParams = { redeId: string; id: PacienteId };
export type BuscarPorCpfParams = { redeId: string; cpf: Cpf; ignorarId?: PacienteId };
export type BuscarPorNomeNascimentoParams = {
  redeId: string;
  nome: string;
  dataNascimento: DataNascimento;
  ignorarId?: PacienteId;
};
export type ListarPacientesParams = {
  redeId: string;
  busca?: string;
  apenasAtivos?: boolean;
  offset: number;
  limite: number;
};
export type ContarPacientesParams = { redeId: string; busca?: string; apenasAtivos?: boolean };

export interface IPacienteRepository {
  buscarPorId(params: BuscarPacienteParams): Promise<Paciente | null>;
  buscarPorCpf(params: BuscarPorCpfParams): Promise<Paciente | null>;
  buscarPorNomeENascimento(params: BuscarPorNomeNascimentoParams): Promise<Paciente | null>;
  listar(params: ListarPacientesParams): Promise<Paciente[]>;
  contar(params: ContarPacientesParams): Promise<number>;
  salvar(paciente: Paciente): Promise<void>;
  atualizar(paciente: Paciente): Promise<void>;
}

export const PACIENTE_REPOSITORY = Symbol('IPacienteRepository');
