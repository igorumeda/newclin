import type { Profissional } from '../entities/profissional.entity';
import type { HorarioAtendimento } from '../entities/horario-atendimento.entity';

export type ProfissionalId = string;
export type BuscarProfissionalParams = { redeId: string; id: ProfissionalId };
export type ListarProfissionaisParams = {
  redeId: string;
  busca?: string;
  unidadeId?: string | null;
  apenasAtivos?: boolean;
};
export type ListarHorariosParams = { redeId: string; profissionalId: ProfissionalId };
export type DefinirHorariosParams = {
  redeId: string;
  profissionalId: ProfissionalId;
  horarios: HorarioAtendimento[];
};

export interface IProfissionalRepository {
  buscarPorId(params: BuscarProfissionalParams): Promise<Profissional | null>;
  listar(params: ListarProfissionaisParams): Promise<Profissional[]>;
  salvar(profissional: Profissional): Promise<void>;
  atualizar(profissional: Profissional): Promise<void>;
  listarHorarios(params: ListarHorariosParams): Promise<HorarioAtendimento[]>;
  definirHorarios(params: DefinirHorariosParams): Promise<void>;
}

export const PROFISSIONAL_REPOSITORY = Symbol('IProfissionalRepository');
