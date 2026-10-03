import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import { validarCampo, TIPOS_CAMPO } from './campo-template.vo';
import type { CampoEstrutura, CampoEstruturaOpcional } from './campo-template.vo';

export type SecaoEstrutura = {
  id: string;
  titulo: string;
  ordem?: number;
  descricao?: string | null;
  campos: CampoEstruturaOpcional[];
};

export type SecaoEstruturaNormalizada = {
  id: string;
  titulo: string;
  ordem: number;
  descricao: string | null;
  campos: CampoEstrutura[];
};

export type EstruturaTemplateProps = { secoes: SecaoEstruturaNormalizada[] };
export type EstruturaTemplateJSON = { secoes: SecaoEstruturaNormalizada[] };

/**
 * Estrutura do template (§3.5): seções ordenadas contendo campos ordenados.
 * É o contrato do motor dinâmico — a mesma estrutura é usada para renderizar o
 * formulário (client) e para validar os dados preenchidos (server).
 */
export class EstruturaTemplate extends ValueObject<EstruturaTemplateProps> {
  private constructor(props: EstruturaTemplateProps) {
    super(props);
  }

  get secoes(): SecaoEstruturaNormalizada[] {
    return this.props.secoes;
  }

  public campos(): CampoEstrutura[] {
    return this.props.secoes.flatMap((secao) => secao.campos);
  }

  public camposObrigatorios(): CampoEstrutura[] {
    return this.campos().filter((campo) => campo.obrigatorio === true);
  }

  public campo(id: string): CampoEstrutura | undefined {
    return this.campos().find((campo) => campo.id === id);
  }

  public camposDoTipo(tipo: string): CampoEstrutura[] {
    return this.campos().filter((campo) => campo.tipo === tipo);
  }

  public toJSON(): EstruturaTemplateJSON {
    return { secoes: this.props.secoes.map((secao) => ({ ...secao })) };
  }

  public static create(secoes: SecaoEstrutura[]): Result<EstruturaTemplate> {
    if (!Array.isArray(secoes) || secoes.length === 0) {
      return Result.fail(new Error('O template precisa de pelo menos uma seção'));
    }

    const idsSecoes = new Set<string>();
    const idsCampos = new Set<string>();
    const normalizadas: SecaoEstruturaNormalizada[] = [];

    for (const [indice, secao] of secoes.entries()) {
      const idSecao = (secao.id ?? '').trim();
      const titulo = (secao.titulo ?? '').trim();

      if (!idSecao || !titulo) {
        return Result.fail(new Error('Toda seção precisa de identificador e título'));
      }
      if (idsSecoes.has(idSecao)) {
        return Result.fail(new Error(`Seção duplicada no template: "${idSecao}"`));
      }
      if (!Array.isArray(secao.campos) || secao.campos.length === 0) {
        return Result.fail(new Error(`A seção "${titulo}" precisa de pelo menos um campo`));
      }

      idsSecoes.add(idSecao);

      const campos: CampoEstrutura[] = [];
      for (const [indiceCampo, campo] of secao.campos.entries()) {
        const erroCampo = validarCampo({ campo });
        if (erroCampo) return Result.fail(new Error(erroCampo));

        if (idsCampos.has(campo.id)) {
          return Result.fail(new Error(`Campo duplicado no template: "${campo.id}"`));
        }
        idsCampos.add(campo.id);

        campos.push({
          id: campo.id,
          rotulo: campo.rotulo.trim(),
          tipo: campo.tipo as CampoEstrutura['tipo'],
          obrigatorio: campo.obrigatorio ?? false,
          ordem: campo.ordem ?? indiceCampo + 1,
          opcoes: campo.tipo === 'selecao_unica' || campo.tipo === 'selecao_multipla' ? (campo.opcoes ?? []) : undefined,
          min: campo.min,
          max: campo.max,
          placeholder: campo.placeholder ?? null,
          ajuda: campo.ajuda ?? null,
        });
      }

      normalizadas.push({
        id: idSecao,
        titulo,
        ordem: secao.ordem ?? indice + 1,
        descricao: secao.descricao ?? null,
        campos: campos.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
      });
    }

    return Result.ok(new EstruturaTemplate({ secoes: normalizadas.sort((a, b) => a.ordem - b.ordem) }));
  }

  /** Reconstrói a estrutura persistida tolerando dados legados. */
  public static reconstitute(json: EstruturaTemplateJSON | { secoes?: unknown } | null): EstruturaTemplate {
    const secoes = Array.isArray((json as EstruturaTemplateJSON)?.secoes)
      ? (json as EstruturaTemplateJSON).secoes
      : [];

    return new EstruturaTemplate({
      secoes: secoes.map((secao) => ({
        id: secao.id,
        titulo: secao.titulo,
        ordem: secao.ordem ?? 0,
        descricao: secao.descricao ?? null,
        campos: Array.isArray(secao.campos) ? secao.campos : [],
      })),
    });
  }

  public static tiposDisponiveis(): string[] {
    return [...TIPOS_CAMPO];
  }
}

/** Template vazio usado como ponto de partida no editor de templates. */
export const ESTRUTURA_PADRAO_EDITOR: SecaoEstrutura[] = [
  {
    id: 'avaliacao',
    titulo: 'Avaliação',
    ordem: 1,
    campos: [
      { id: 'avaliacao-inicial', rotulo: 'Descrição da avaliação', tipo: 'texto_longo', obrigatorio: true, ordem: 1 },
    ],
  },
];
