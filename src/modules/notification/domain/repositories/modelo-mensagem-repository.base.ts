import type { ModeloMensagem } from '../entities/modelo-mensagem.entity';
import type {
  BuscarModeloParams,
  IModeloMensagemRepository,
} from './modelo-mensagem-repository.interface';

export abstract class ModeloMensagemRepository implements IModeloMensagemRepository {
  abstract listar(redeId: string): Promise<ModeloMensagem[]>;
  abstract buscarAtivo(params: BuscarModeloParams): Promise<ModeloMensagem | null>;
  abstract save(modelo: ModeloMensagem): Promise<void>;
  abstract update(modelo: ModeloMensagem): Promise<void>;
}
