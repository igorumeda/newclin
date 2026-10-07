import type { TemplateProntuario } from '../entities/template-prontuario.entity';

export type BuscarTemplateParams = { redeId: string; id: string };
export type ListarTemplatesParams = {
  redeId: string;
  especialidade?: string | null;
  apenasAtivos?: boolean;
};
export type BuscarTemplatePadraoParams = { redeId: string; especialidade: string };

export interface ITemplateProntuarioRepository {
  buscarPorId(params: BuscarTemplateParams): Promise<TemplateProntuario | null>;
  buscarPadraoPorEspecialidade(
    params: BuscarTemplatePadraoParams,
  ): Promise<TemplateProntuario | null>;
  listar(params: ListarTemplatesParams): Promise<TemplateProntuario[]>;
  salvar(template: TemplateProntuario): Promise<void>;
  atualizar(template: TemplateProntuario): Promise<void>;
}

export const TEMPLATE_PRONTUARIO_REPOSITORY = Symbol('ITemplateProntuarioRepository');
