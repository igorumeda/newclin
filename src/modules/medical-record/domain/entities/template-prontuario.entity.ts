import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { EstruturaTemplate } from '../value-objects/estrutura-template.vo';
import type { SecaoEstrutura } from '../value-objects/estrutura-template.vo';
import { InvalidProntuarioOperationError } from '../errors/prontuario.errors';

export type OrigemTemplate = 'padrao' | 'proprio' | 'clonado';

export type TemplateProntuarioProps = {
  redeId: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  estrutura: EstruturaTemplate;
  versao: number;
  origem: OrigemTemplate;
  templateBaseId: string | null;
  isPadrao: boolean;
  ativo: boolean;
  createdBy: string | null;
};

export type TemplateProntuarioConstructorParams = EntityConstructorParams<TemplateProntuarioProps>;

export type CreateTemplateParams = {
  redeId: string;
  nome: string;
  especialidade: string;
  descricao?: string | null;
  secoes: SecaoEstrutura[];
  origem?: OrigemTemplate;
  templateBaseId?: string | null;
  isPadrao?: boolean;
  createdBy?: string | null;
};

/**
 * Template de prontuário (§3.5). Alterar a estrutura incrementa a versão —
 * os atendimentos guardam a versão usada para preservar o histórico.
 */
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
  get estrutura(): EstruturaTemplate {
    return this.props.estrutura;
  }
  get versao(): number {
    return this.props.versao;
  }
  get origem(): OrigemTemplate {
    return this.props.origem;
  }
  get templateBaseId(): string | null {
    return this.props.templateBaseId;
  }
  get isPadrao(): boolean {
    return this.props.isPadrao;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }

  public static create(params: CreateTemplateParams): Result<TemplateProntuario> {
    const nome = (params.nome ?? '').trim();
    if (nome.length < 3) {
      return Result.fail(new InvalidProntuarioOperationError({ reason: 'Nome do template deve ter ao menos 3 caracteres' }));
    }

    const especialidade = (params.especialidade ?? '').trim();
    if (especialidade.length < 3) {
      return Result.fail(new InvalidProntuarioOperationError({ reason: 'Informe a especialidade do template' }));
    }

    const estruturaResult = EstruturaTemplate.create(params.secoes);
    if (estruturaResult.isFailure) return Result.fail(estruturaResult.error);

    return Result.ok(
      new TemplateProntuario({
        props: {
          redeId: params.redeId,
          nome,
          especialidade,
          descricao: params.descricao ?? null,
          estrutura: estruturaResult.value,
          versao: 1,
          origem: params.origem ?? 'proprio',
          templateBaseId: params.templateBaseId ?? null,
          isPadrao: params.isPadrao ?? false,
          ativo: true,
          createdBy: params.createdBy ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: TemplateProntuarioConstructorParams): TemplateProntuario {
    return new TemplateProntuario(params);
  }

  /** Clona um template (padrão ou de outra rede) mantendo a estrutura. */
  public static clonar(params: {
    origem: TemplateProntuario;
    redeId: string;
    nome: string;
    especialidade?: string;
    createdBy?: string | null;
  }): Result<TemplateProntuario> {
    return TemplateProntuario.create({
      redeId: params.redeId,
      nome: params.nome,
      especialidade: params.especialidade ?? params.origem.especialidade,
      descricao: params.origem.descricao,
      secoes: params.origem.estrutura.secoes,
      origem: 'clonado',
      templateBaseId: params.origem.id.toString(),
      isPadrao: false,
      createdBy: params.createdBy ?? null,
    });
  }

  public atualizarDados(params: {
    nome?: string;
    especialidade?: string;
    descricao?: string | null;
    secoes?: SecaoEstrutura[];
  }): Result<void> {
    if (params.nome !== undefined) {
      const nome = params.nome.trim();
      if (nome.length < 3) {
        return Result.fail(
          new InvalidProntuarioOperationError({ reason: 'Nome do template deve ter ao menos 3 caracteres' }),
        );
      }
      this.props.nome = nome;
    }

    if (params.especialidade !== undefined) {
      const especialidade = params.especialidade.trim();
      if (especialidade.length < 3) {
        return Result.fail(new InvalidProntuarioOperationError({ reason: 'Informe a especialidade do template' }));
      }
      this.props.especialidade = especialidade;
    }

    if (params.descricao !== undefined) this.props.descricao = params.descricao;

    if (params.secoes !== undefined) {
      const estruturaResult = EstruturaTemplate.create(params.secoes);
      if (estruturaResult.isFailure) return Result.fail(estruturaResult.error);

      const estruturaMudou =
        JSON.stringify(estruturaResult.value.toJSON()) !== JSON.stringify(this.props.estrutura.toJSON());

      this.props.estrutura = estruturaResult.value;
      // Histórico preservado: cada mudança estrutural gera uma nova versão.
      if (estruturaMudou) this.props.versao += 1;
    }

    this.touch();
    return Result.ok();
  }

  public inativar(): Result<void> {
    if (!this.props.ativo) {
      return Result.fail(new InvalidProntuarioOperationError({ reason: 'Template já está inativo' }));
    }
    if (this.props.isPadrao) {
      return Result.fail(
        new InvalidProntuarioOperationError({
          reason: 'Templates padrão do sistema não podem ser inativados — clone e edite o clone',
        }),
      );
    }
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) {
      return Result.fail(new InvalidProntuarioOperationError({ reason: 'Template já está ativo' }));
    }
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }
}
