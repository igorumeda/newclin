import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import { GeradorPdfProvider } from './gerador-pdf-provider.base';
import type {
  DocumentoPdfGerado,
  GerarDocumentoPdfParams,
} from '../../../domain/services/gerador-pdf-provider.interface';

type LinhasConteudoParams = { params: GerarDocumentoPdfParams };
type EscreverParams = {
  page: PDFPage;
  texto: string;
  x: number;
  y: number;
  tamanho: number;
  fonte: PDFFont;
  cinza?: boolean;
};
type QuebrarTextoParams = { texto: string; fonte: PDFFont; tamanho: number; largura: number };

const MARGEM = 56;
const LARGURA_A4 = 595.28;
const ALTURA_A4 = 841.89;

export class PdfLibGeradorProvider extends GeradorPdfProvider {
  async gerar(params: GerarDocumentoPdfParams): Promise<DocumentoPdfGerado> {
    const documento = await PDFDocument.create();
    documento.setTitle(`${params.titulo} — ${params.paciente.nome}`);
    documento.setProducer('NewClin');

    const page = documento.addPage([LARGURA_A4, ALTURA_A4]);
    const regular = await documento.embedFont(StandardFonts.Helvetica);
    const negrito = await documento.embedFont(StandardFonts.HelveticaBold);

    let y = ALTURA_A4 - MARGEM;

    this.escrever({
      page,
      texto: params.cabecalho.redeNome,
      x: MARGEM,
      y,
      tamanho: 16,
      fonte: negrito,
    });
    y -= 18;
    this.escrever({
      page,
      texto: `${params.cabecalho.unidadeNome} — ${params.cabecalho.unidadeEndereco}`,
      x: MARGEM,
      y,
      tamanho: 9,
      fonte: regular,
      cinza: true,
    });
    if (params.cabecalho.unidadeTelefone) {
      y -= 12;
      this.escrever({
        page,
        texto: `Telefone: ${params.cabecalho.unidadeTelefone}`,
        x: MARGEM,
        y,
        tamanho: 9,
        fonte: regular,
        cinza: true,
      });
    }

    y -= 16;
    page.drawLine({
      start: { x: MARGEM, y },
      end: { x: LARGURA_A4 - MARGEM, y },
      thickness: 1,
      color: rgb(0.82, 0.84, 0.88),
    });

    y -= 32;
    this.escrever({
      page,
      texto: params.titulo.toUpperCase(),
      x: MARGEM,
      y,
      tamanho: 14,
      fonte: negrito,
    });

    y -= 24;
    this.escrever({
      page,
      texto: `Paciente: ${params.paciente.nome}`,
      x: MARGEM,
      y,
      tamanho: 11,
      fonte: regular,
    });
    y -= 14;
    this.escrever({
      page,
      texto: `CPF: ${params.paciente.cpf}   Nascimento: ${params.paciente.dataNascimento}`,
      x: MARGEM,
      y,
      tamanho: 10,
      fonte: regular,
      cinza: true,
    });

    y -= 28;
    const linhas = this.linhasConteudo({ params });
    linhas.forEach((linha) => {
      const partes = this.quebrarTexto({
        texto: linha,
        fonte: regular,
        tamanho: 11,
        largura: LARGURA_A4 - MARGEM * 2,
      });
      partes.forEach((parte) => {
        this.escrever({ page, texto: parte, x: MARGEM, y, tamanho: 11, fonte: regular });
        y -= 16;
      });
    });

    const yAssinatura = Math.max(y - 60, MARGEM + 90);
    page.drawLine({
      start: { x: MARGEM, y: yAssinatura },
      end: { x: MARGEM + 240, y: yAssinatura },
      thickness: 1,
      color: rgb(0.3, 0.33, 0.4),
    });
    this.escrever({
      page,
      texto: params.profissional.nome,
      x: MARGEM,
      y: yAssinatura - 14,
      tamanho: 11,
      fonte: negrito,
    });
    this.escrever({
      page,
      texto: `${params.profissional.conselho} ${params.profissional.numeroConselho}/${params.profissional.ufConselho} — ${params.profissional.especialidade}`,
      x: MARGEM,
      y: yAssinatura - 28,
      tamanho: 9,
      fonte: regular,
      cinza: true,
    });

    this.escrever({
      page,
      texto: `Emitido em ${params.emitidoEm.toLocaleString('pt-BR')} — código ${params.codigoVerificacao}`,
      x: MARGEM,
      y: MARGEM - 16,
      tamanho: 8,
      fonte: regular,
      cinza: true,
    });

    const bytes = await documento.save();
    return { conteudo: bytes, mimeType: 'application/pdf' };
  }

  private escrever({ page, texto, x, y, tamanho, fonte, cinza }: EscreverParams): void {
    page.drawText(texto, {
      x,
      y,
      size: tamanho,
      font: fonte,
      color: cinza ? rgb(0.42, 0.45, 0.52) : rgb(0.09, 0.11, 0.15),
    });
  }

  private quebrarTexto({ texto, fonte, tamanho, largura }: QuebrarTextoParams): string[] {
    const palavras = texto.split(/\s+/);
    const linhas: string[] = [];
    let atual = '';

    palavras.forEach((palavra) => {
      const candidata = atual ? `${atual} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(candidata, tamanho) > largura && atual) {
        linhas.push(atual);
        atual = palavra;
        return;
      }
      atual = candidata;
    });
    if (atual) linhas.push(atual);
    return linhas.length > 0 ? linhas : [''];
  }

  private linhasConteudo({ params }: LinhasConteudoParams): string[] {
    const conteudo = params.conteudo;
    const texto = (chave: string): string => String(conteudo[chave] ?? '').trim();

    switch (params.tipo) {
      case 'receita': {
        const medicamentos = Array.isArray(conteudo.medicamentos)
          ? (conteudo.medicamentos as unknown[]).map((item) => String(item))
          : texto('medicamentos').split('\n');
        return [
          'Prescrição:',
          '',
          ...medicamentos.map((item, indice) => `${indice + 1}. ${item}`),
          '',
          texto('orientacoes') ? `Orientações: ${texto('orientacoes')}` : '',
        ].filter((linha) => linha !== undefined);
      }
      case 'atestado':
        return [
          `Atesto, para os devidos fins, que o paciente acima esteve sob meus cuidados profissionais e necessita de afastamento de suas atividades por ${texto('diasAfastamento')} dia(s), a partir de ${texto('dataInicio') || params.emitidoEm.toLocaleDateString('pt-BR')}.`,
          '',
          texto('cid10') ? `CID-10: ${texto('cid10')}` : '',
          texto('observacoes') ? `Observações: ${texto('observacoes')}` : '',
        ];
      case 'solicitacao_exames': {
        const exames = Array.isArray(conteudo.exames)
          ? (conteudo.exames as unknown[]).map((item) => String(item))
          : texto('exames').split('\n');
        return [
          'Solicito os seguintes exames:',
          '',
          ...exames.map((item, indice) => `${indice + 1}. ${item}`),
          '',
          texto('indicacaoClinica') ? `Indicação clínica: ${texto('indicacaoClinica')}` : '',
        ];
      }
      case 'declaracao_comparecimento':
        return [
          `Declaro que o paciente acima compareceu a esta unidade em ${texto('data') || params.emitidoEm.toLocaleDateString('pt-BR')}, no período das ${texto('horaChegada')} às ${texto('horaSaida')}.`,
          '',
          texto('acompanhante') ? `Acompanhante: ${texto('acompanhante')}` : '',
        ];
      default:
        return [JSON.stringify(conteudo)];
    }
  }
}
