import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import { TIPOS_CAMPO, TIPOS_COM_OPCOES } from './tipo-campo.vo';
import type { TipoCampoValue } from './tipo-campo.vo';

export type CampoTemplate = {
  id: string;
  rotulo: string;
  tipo: TipoCampoValue;
  obrigatorio: boolean;
  valorPadrao: string | null;
  opcoes: string[];
  ajuda: string | null;
};

export type SecaoTemplate = {
  id: string;
  titulo: string;
  ordem: number;
  campos: CampoTemplate[];
};

export type EstruturaTemplateProps = { secoes: SecaoTemplate[] };

export type CampoTemplateEntrada = {
  id?: string;
  rotulo: string;
  tipo: string;
  obrigatorio?: boolean;
  valorPadrao?: string | null;
  opcoes?: string[];
  ajuda?: string | null;
};

export type SecaoTemplateEntrada = {
  id?: string;
  titulo: string;
  ordem?: number;
  campos: CampoTemplateEntrada[];
};

export type CriarEstruturaParams = { secoes: SecaoTemplateEntrada[] };
export type BuscarCampoParams = { campoId: string };

const MAX_SECOES = 30;
const MAX_CAMPOS_POR_SECAO = 50;

function slug(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

export class EstruturaTemplate extends ValueObject<EstruturaTemplateProps> {
  private constructor(props: EstruturaTemplateProps) {
    super(props);
  }

  get secoes(): SecaoTemplate[] {
    return this.props.secoes;
  }

  get campos(): CampoTemplate[] {
    return this.props.secoes.flatMap((secao) => secao.campos);
  }

  get totalCampos(): number {
    return this.campos.length;
  }

  public buscarCampo({ campoId }: BuscarCampoParams): CampoTemplate | null {
    return this.campos.find((campo) => campo.id === campoId) ?? null;
  }

  public static create(params: CriarEstruturaParams): Result<EstruturaTemplate> {
    if (params.secoes.length === 0) {
      return Result.fail(new Error('O template precisa de ao menos uma seção'));
    }
    if (params.secoes.length > MAX_SECOES) {
      return Result.fail(new Error(`O template pode ter no máximo ${MAX_SECOES} seções`));
    }

    const idsSecoes = new Set<string>();
    const idsCampos = new Set<string>();
    const secoes: SecaoTemplate[] = [];

    for (let indiceSecao = 0; indiceSecao < params.secoes.length; indiceSecao += 1) {
      const entrada = params.secoes[indiceSecao];
      if (!entrada.titulo || entrada.titulo.trim().length < 2) {
        return Result.fail(new Error('Toda seção precisa de um título'));
      }
      const idSecao = entrada.id?.trim() || slug(entrada.titulo) || `secao_${indiceSecao + 1}`;
      if (idsSecoes.has(idSecao)) {
        return Result.fail(new Error(`Seção duplicada: ${entrada.titulo}`));
      }
      idsSecoes.add(idSecao);

      if (entrada.campos.length === 0) {
        return Result.fail(new Error(`A seção "${entrada.titulo}" precisa de ao menos um campo`));
      }
      if (entrada.campos.length > MAX_CAMPOS_POR_SECAO) {
        return Result.fail(
          new Error(`A seção "${entrada.titulo}" excede ${MAX_CAMPOS_POR_SECAO} campos`),
        );
      }

      const campos: CampoTemplate[] = [];
      for (let indiceCampo = 0; indiceCampo < entrada.campos.length; indiceCampo += 1) {
        const campoEntrada = entrada.campos[indiceCampo];
        if (!campoEntrada.rotulo || campoEntrada.rotulo.trim().length < 2) {
          return Result.fail(new Error('Todo campo precisa de um rótulo'));
        }
        if (!TIPOS_CAMPO.includes(campoEntrada.tipo as TipoCampoValue)) {
          return Result.fail(new Error(`Tipo de campo inválido: ${campoEntrada.tipo}`));
        }
        const tipo = campoEntrada.tipo as TipoCampoValue;
        const opcoes = (campoEntrada.opcoes ?? [])
          .map((opcao) => opcao.trim())
          .filter((opcao) => opcao.length > 0);
        if (TIPOS_COM_OPCOES.includes(tipo) && opcoes.length < 2) {
          return Result.fail(
            new Error(`O campo "${campoEntrada.rotulo}" precisa de ao menos duas opções`),
          );
        }
        const idCampo =
          campoEntrada.id?.trim() ||
          `${idSecao}__${slug(campoEntrada.rotulo) || `campo_${indiceCampo + 1}`}`;
        if (idsCampos.has(idCampo)) {
          return Result.fail(new Error(`Campo duplicado: ${campoEntrada.rotulo}`));
        }
        idsCampos.add(idCampo);

        campos.push({
          id: idCampo,
          rotulo: campoEntrada.rotulo.trim(),
          tipo,
          obrigatorio: campoEntrada.obrigatorio ?? false,
          valorPadrao: campoEntrada.valorPadrao?.toString().trim() || null,
          opcoes,
          ajuda: campoEntrada.ajuda?.trim() || null,
        });
      }

      secoes.push({
        id: idSecao,
        titulo: entrada.titulo.trim(),
        ordem: entrada.ordem ?? indiceSecao + 1,
        campos,
      });
    }

    secoes.sort((a, b) => a.ordem - b.ordem);
    return Result.ok(new EstruturaTemplate({ secoes }));
  }

  public static reconstitute(props: EstruturaTemplateProps): EstruturaTemplate {
    return new EstruturaTemplate(props);
  }
}
