import type { Auditoria } from '../entities/auditoria.entity';
import type {
  IAuditoriaRepository,
  ListarAuditoriaFiltro,
  ListarAuditoriaResultado,
} from './auditoria-repository.interface';

export abstract class AuditoriaRepository implements IAuditoriaRepository {
  abstract registrar(auditoria: Auditoria): Promise<void>;
  abstract listar(filtro: ListarAuditoriaFiltro): Promise<ListarAuditoriaResultado>;
  abstract listarPorRegistro(params: {
    redeId: string;
    entidade: string;
    registroId: string;
  }): Promise<Auditoria[]>;
}
