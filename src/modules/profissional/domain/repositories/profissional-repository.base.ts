import type { Profissional } from '../entities/profissional.entity';
import type { HorarioAtendimento } from '../entities/horario-atendimento.entity';
import type {
  BuscarProfissionalParams,
  DefinirHorariosParams,
  IProfissionalRepository,
  ListarHorariosParams,
  ListarProfissionaisParams,
} from './profissional-repository.interface';

export abstract class ProfissionalRepository implements IProfissionalRepository {
  abstract buscarPorId(params: BuscarProfissionalParams): Promise<Profissional | null>;
  abstract listar(params: ListarProfissionaisParams): Promise<Profissional[]>;
  abstract salvar(profissional: Profissional): Promise<void>;
  abstract atualizar(profissional: Profissional): Promise<void>;
  abstract listarHorarios(params: ListarHorariosParams): Promise<HorarioAtendimento[]>;
  abstract definirHorarios(params: DefinirHorariosParams): Promise<void>;
}
