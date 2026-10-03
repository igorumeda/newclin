import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import type { TipoDocumento } from './tipo-documento.vo';

export type ItemReceita = {
  medicamento: string;
  dosagem: string;
  via: string;
  frequencia: string;
  duracao: string;
  observacoes?: string | null;
};

export type ItemExame = {
  nome: string;
  observacoes?: string | null;
};

export type ConteudoDocumento = {
  /** Receita */
  itens?: ItemReceita[];
  orientacoes?: string | null;
  /** Atestado */
  diasAfastamento?: number | null;
  cid?: string | null;
  finalidade?: string | null;
  /** Solicitação de exames */
  exames?: ItemExame[];
  justificativa?: string | null;
  /** Declaração de comparecimento */
  dataComparecimento?: string | null;
  horaEntrada?: string | null;
  horaSaida?: string | null;
  procedimento?: string | null;
  /** Campos comuns */
  observacoes?: string | null;
  textoLivre?: string | null;
};

export type ConteudoDocumentoProps = ConteudoDocumento;

export type ValidarConteudoParams = { tipo: TipoDocumento; conteudo: ConteudoDocumento };

/** Conteúdo tipado por documento — validado antes de emitir o PDF (§3.6). */
export class ConteudoDocumentoVO extends ValueObject<ConteudoDocumentoProps> {
  private constructor(props: ConteudoDocumentoProps) {
    super(props);
  }

  get valores(): ConteudoDocumento {
    return this.props;
  }

  public toJSON(): ConteudoDocumento {
    return { ...this.props };
  }

  public static create(conteudo: ConteudoDocumento): Result<ConteudoDocumentoVO> {
    if (conteudo === null || typeof conteudo !== 'object' || Array.isArray(conteudo)) {
      return Result.fail(new Error('Conteúdo do documento deve ser um objeto'));
    }

    return Result.ok(new ConteudoDocumentoVO(conteudo));
  }

  public static reconstitute(conteudo: ConteudoDocumento): ConteudoDocumentoVO {
    return new ConteudoDocumentoVO(conteudo ?? {});
  }

  /** Valida os campos exigidos para cada tipo antes da emissão. */
  public validarParaEmissao(params: { tipo: TipoDocumento }): string[] {
    const problemas: string[] = [];
    const conteudo = this.props;

    switch (params.tipo) {
      case 'receita': {
        if (!conteudo.itens || conteudo.itens.length === 0) {
          problemas.push('Informe ao menos um medicamento na receita');
        } else {
          conteudo.itens.forEach((item, indice) => {
            if (!item.medicamento?.trim()) problemas.push(`Medicamento ${indice + 1}: informe o nome`);
            if (!item.dosagem?.trim()) problemas.push(`Medicamento ${indice + 1}: informe a dosagem`);
            if (!item.frequencia?.trim()) problemas.push(`Medicamento ${indice + 1}: informe a frequência`);
          });
        }
        break;
      }

      case 'atestado': {
        if (!conteudo.diasAfastamento || conteudo.diasAfastamento <= 0) {
          problemas.push('Informe o número de dias de afastamento');
        }
        if (!conteudo.finalidade?.trim()) {
          problemas.push('Informe a finalidade do atestado');
        }
        break;
      }

      case 'solicitacao_exames': {
        if (!conteudo.exames || conteudo.exames.length === 0) {
          problemas.push('Informe ao menos um exame solicitado');
        }
        break;
      }

      case 'declaracao_comparecimento': {
        if (!conteudo.dataComparecimento) problemas.push('Informe a data do comparecimento');
        if (!conteudo.horaEntrada) problemas.push('Informe o horário de entrada');
        break;
      }
    }

    return problemas;
  }
}
