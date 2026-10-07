import type { RegistroAuditoria } from '../entities/registro-auditoria.entity';
import type {
  AcessoProntuarioRegistro,
  ContarAuditoriaParams,
  IAuditoriaRepository,
  ListarAcessosProntuarioParams,
  ListarAuditoriaParams,
  RegistrarAcessoProntuarioParams,
} from './auditoria-repository.interface';

export abstract class AuditoriaRepository implements IAuditoriaRepository {
  abstract registrar(registro: RegistroAuditoria): Promise<void>;
  abstract listar(params: ListarAuditoriaParams): Promise<RegistroAuditoria[]>;
  abstract contar(params: ContarAuditoriaParams): Promise<number>;
  abstract registrarAcessoProntuario(params: RegistrarAcessoProntuarioParams): Promise<void>;
  abstract listarAcessosProntuario(
    params: ListarAcessosProntuarioParams,
  ): Promise<AcessoProntuarioRegistro[]>;
}
