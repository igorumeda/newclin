import type { TemplateProntuario } from '../entities/template-prontuario.entity';
import type {
  BuscarTemplateParams,
  BuscarTemplatePadraoParams,
  ITemplateProntuarioRepository,
  ListarTemplatesParams,
} from './template-repository.interface';

export abstract class TemplateProntuarioRepository implements ITemplateProntuarioRepository {
  abstract buscarPorId(params: BuscarTemplateParams): Promise<TemplateProntuario | null>;
  abstract buscarPadraoPorEspecialidade(
    params: BuscarTemplatePadraoParams,
  ): Promise<TemplateProntuario | null>;
  abstract listar(params: ListarTemplatesParams): Promise<TemplateProntuario[]>;
  abstract salvar(template: TemplateProntuario): Promise<void>;
  abstract atualizar(template: TemplateProntuario): Promise<void>;
}
