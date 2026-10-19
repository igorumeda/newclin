import type { ModeloMensagem } from '../entities/modelo-mensagem.entity';
import type { CanalNotificacao, TipoNotificacao } from '../value-objects/tipos.vo';

export type BuscarModeloParams = {
  redeId: string;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
};

export interface IModeloMensagemRepository {
  listar(redeId: string): Promise<ModeloMensagem[]>;
  buscarAtivo(params: BuscarModeloParams): Promise<ModeloMensagem | null>;
  save(modelo: ModeloMensagem): Promise<void>;
  update(modelo: ModeloMensagem): Promise<void>;
}

export const MODELO_MENSAGEM_REPOSITORY = Symbol('IModeloMensagemRepository');
