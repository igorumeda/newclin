import type { Paciente } from '../entities/paciente.entity';
import type {
  BuscarPacienteParams,
  BuscarPorCpfParams,
  BuscarPorNomeNascimentoParams,
  ContarPacientesParams,
  IPacienteRepository,
  ListarPacientesParams,
} from './paciente-repository.interface';

export abstract class PacienteRepository implements IPacienteRepository {
  abstract buscarPorId(params: BuscarPacienteParams): Promise<Paciente | null>;
  abstract buscarPorCpf(params: BuscarPorCpfParams): Promise<Paciente | null>;
  abstract buscarPorNomeENascimento(
    params: BuscarPorNomeNascimentoParams,
  ): Promise<Paciente | null>;
  abstract listar(params: ListarPacientesParams): Promise<Paciente[]>;
  abstract contar(params: ContarPacientesParams): Promise<number>;
  abstract salvar(paciente: Paciente): Promise<void>;
  abstract atualizar(paciente: Paciente): Promise<void>;
}
