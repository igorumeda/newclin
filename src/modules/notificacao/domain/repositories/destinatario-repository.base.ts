import type {
  BuscarDestinatarioParams,
  DestinatarioAgendamento,
  IDestinatarioRepository,
  ListarParaLembreteParams,
} from './destinatario-repository.interface';

export abstract class DestinatarioRepository implements IDestinatarioRepository {
  abstract buscarPorAgendamento(
    params: BuscarDestinatarioParams,
  ): Promise<DestinatarioAgendamento | null>;
  abstract listarParaLembrete(
    params: ListarParaLembreteParams,
  ): Promise<DestinatarioAgendamento[]>;
}
