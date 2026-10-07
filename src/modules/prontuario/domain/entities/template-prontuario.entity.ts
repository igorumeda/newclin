import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { EstruturaTemplate } from '../value-objects/estrutura-template.vo';
import type { SecaoTemplateEntrada } from '../value-objects/estrutura-template.vo';

export type TemplateProntuarioProps = {
  redeId: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  versao: number;
  estrutura: EstruturaTemplate;
  padrao: boolean;
  ativo: boolean;
};

export type TemplateProntuarioConstructorParams = EntityConstructorParams<TemplateProntuarioProps>;
export type ReconstituirTemplateParams = TemplateProntuarioConstructorParams & {
  id: NonNullable<TemplateProntuarioConstructorParams['id']>;
};
export type CriarTemplateParams = {
  redeId: string;
  nome: string;
  especialidade: string;
  descricao?: string | null;
  secoes: SecaoTemplateEntrada[];
  padrao?: boolean;
};
export type AtualizarTemplateParams = {
  nome?: string;
  especialidade?: string;
  descricao?: string | null;
  secoes?: SecaoTemplateEntrada[];
  padrao?: boolean;
  ativo?: boolean;
};

export class TemplateProntuario extends AggregateRoot<TemplateProntuarioProps> {
  private constructor(params: TemplateProntuarioConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get especialidade(): string {
    return this.props.especialidade;
  }

  get descricao(): string | null {
    return this.props.descricao;
  }

  get versao(): number {
    return this.props.versao;
  }

  get estrutura(): EstruturaTemplate {
    return this.props.estrutura;
  }

  get padrao(): boolean {
    return this.props.padrao;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CriarTemplateParams): Result<TemplateProntuario> {
    if (!params.nome || params.nome.trim().length < 3) {
      return Result.fail(new Error('Nome do template deve ter no mínimo 3 caracteres'));
    }
    if (!params.especialidade || params.especialidade.trim().length < 3) {
      return Result.fail(new Error('Informe a especialidade do template'));
    }
    const estruturaResult = EstruturaTemplate.create({ secoes: params.secoes });
    if (estruturaResult.isFailure) return Result.propagate(estruturaResult);

    return Result.ok(
      new TemplateProntuario({
        props: {
          redeId: params.redeId,
          nome: params.nome.trim(),
          especialidade: params.especialidade.trim(),
          descricao: params.descricao?.trim() || null,
          versao: 1,
          estrutura: estruturaResult.value,
          padrao: params.padrao ?? false,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirTemplateParams): TemplateProntuario {
    return new TemplateProntuario(params);
  }

  /**
   * Alterar a estrutura cria uma nova versão: atendimentos antigos continuam
   * sendo exibidos com a versão em que foram preenchidos (spec §3.5).
   */
  public atualizar(params: AtualizarTemplateParams): Result<void> {
    if (params.nome !== undefined) {
      if (params.nome.trim().length < 3) {
        return Result.fail(new Error('Nome do template deve ter no mínimo 3 caracteres'));
      }
      this.props.nome = params.nome.trim();
    }
    if (params.especialidade !== undefined) {
      if (params.especialidade.trim().length < 3) {
        return Result.fail(new Error('Informe a especialidade do template'));
      }
      this.props.especialidade = params.especialidade.trim();
    }
    if (params.descricao !== undefined) {
      this.props.descricao = params.descricao?.trim() || null;
    }
    if (params.secoes !== undefined) {
      const estruturaResult = EstruturaTemplate.create({ secoes: params.secoes });
      if (estruturaResult.isFailure) return Result.propagate(estruturaResult);
      this.props.estrutura = estruturaResult.value;
      this.props.versao += 1;
    }
    if (params.padrao !== undefined) this.props.padrao = params.padrao;
    if (params.ativo !== undefined) this.props.ativo = params.ativo;
    this.touch();
    return Result.ok();
  }
}
