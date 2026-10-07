import type { Anexo } from '../entities/anexo.entity';

export type BuscarAnexoParams = { redeId: string; id: string };
export type ListarAnexosParams = {
  redeId: string;
  pacienteId?: string | null;
  atendimentoId?: string | null;
};
export type RemoverAnexoParams = { redeId: string; id: string };

export interface IAnexoRepository {
  buscarPorId(params: BuscarAnexoParams): Promise<Anexo | null>;
  listar(params: ListarAnexosParams): Promise<Anexo[]>;
  salvar(anexo: Anexo): Promise<void>;
  remover(params: RemoverAnexoParams): Promise<void>;
}

export const ANEXO_REPOSITORY = Symbol('IAnexoRepository');
