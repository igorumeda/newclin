import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import type {
  DocumentoPdfGerado,
  GerarDocumentoPdfParams,
  IDocumentoPdf,
} from '../../../domain/services/documento-ports.interface';
import { TIPO_DOCUMENTO_LABELS } from '../../../domain/value-objects/tipo-documento.vo';

const MARGEM = 48;
const LARGURA_A4 = 595.28;
const ALTURA_A4 = 841.89;
const COR_PRIMARIA = rgb(0.05, 0.42, 0.6);
const COR_TEXTO = rgb(0.13, 0.16, 0.2);
const COR_SUAVE = rgb(0.45, 0.49, 0.55);

type ContextoPdf = {
  page: PDFPage;
  y: number;
  font: PDFFont;
  fontBold: PDFFont;
};

/**
 * Geração dos PDFs dos documentos clínicos (§3.6) com pdf-lib:
 * cabeçalho com logotipo/unidade/endereço/telefone, corpo por tipo de
 * documento, assinatura do profissional e rodapé com numeração e emissão.
 */
export class PdfLibDocumentoProvider implements IDocumentoPdf {
  async gerar(params: GerarDocumentoPdfParams): Promise<DocumentoPdfGerado> {
    const pdf = await PDFDocument.create();
    pdf.setTitle(`${TIPO_DOCUMENTO_LABELS[params.tipo]} ${this.numeroFormatado(params)}`);
    pdf.setAuthor(params.cabecalho.redeNome);
    pdf.setSubject(TIPO_DOCUMENTO_LABELS[params.tipo]);

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([LARGURA_A4, ALTURA_A4]);

    const contexto: ContextoPdf = { page, y: ALTURA_A4 - MARGEM, font, fontBold };

    await this.desenharCabecalho(params, contexto);
    this.desenharIdentificacaoPaciente(params, contexto);
    this.desenharCorpo(params, contexto);
    this.desenharAssinatura(params, contexto);
    this.desenharRodape(params, contexto);

    const bytes = await pdf.save();

    return {
      bytes,
      mimeType: 'application/pdf',
      nomeArquivo: `${this.numeroFormatado(params)}.pdf`,
    };
  }

  private numeroFormatado(params: GerarDocumentoPdfParams): string {
    const prefixos: Record<string, string> = {
      receita: 'REC',
      atestado: 'ATE',
      solicitacao_exames: 'SOL',
      declaracao_comparecimento: 'DEC',
    };

    return `${prefixos[params.tipo] ?? 'DOC'}-${String(params.numero).padStart(6, '0')}`;
  }

  private async desenharCabecalho(params: GerarDocumentoPdfParams, contexto: ContextoPdf): Promise<void> {
    const cabecalho = params.cabecalho;
    const tituloUnidade: string = cabecalho.unidadeNome || cabecalho.redeNome || 'Clínica';

    const logotipoUrl = cabecalho.logotipoUrl;

    if (logotipoUrl) {
      const logotipo = await this.baixarImagem(logotipoUrl, contexto);
      if (logotipo) {
        contexto.page.drawImage(logotipo, { x: MARGEM, y: contexto.y - 34, width: 70, height: 34 });
      }
    }

    contexto.page.drawText(tituloUnidade, {
      x: LARGURA_A4 - MARGEM - contexto.fontBold.widthOfTextAtSize(tituloUnidade, 13),
      y: contexto.y - 12,
      size: 13,
      font: contexto.fontBold,
      color: COR_PRIMARIA,
    });

    const linha2 = cabecalho.unidadeEndereco || '';
    const linha3 = cabecalho.unidadeTelefone ? `Telefone: ${cabecalho.unidadeTelefone}` : '';

    if (linha2) {
      contexto.page.drawText(this.limitar(linha2, contexto.font, 8.5, 320), {
        x: LARGURA_A4 - MARGEM - contexto.font.widthOfTextAtSize(this.limitar(linha2, contexto.font, 8.5, 320), 8.5),
        y: contexto.y - 26,
        size: 8.5,
        font: contexto.font,
        color: COR_SUAVE,
      });
    }

    if (linha3) {
      contexto.page.drawText(linha3, {
        x: LARGURA_A4 - MARGEM - contexto.font.widthOfTextAtSize(linha3, 8.5),
        y: contexto.y - 38,
        size: 8.5,
        font: contexto.font,
        color: COR_SUAVE,
      });
    }

    contexto.y -= 56;
    contexto.page.drawLine({
      start: { x: MARGEM, y: contexto.y },
      end: { x: LARGURA_A4 - MARGEM, y: contexto.y },
      thickness: 1,
      color: COR_PRIMARIA,
    });
    contexto.y -= 28;

    contexto.page.drawText(TIPO_DOCUMENTO_LABELS[params.tipo].toUpperCase(), {
      x: MARGEM,
      y: contexto.y,
      size: 14,
      font: contexto.fontBold,
      color: COR_TEXTO,
    });

    const numero = this.numeroFormatado(params);
    contexto.page.drawText(numero, {
      x: LARGURA_A4 - MARGEM - contexto.fontBold.widthOfTextAtSize(numero, 11),
      y: contexto.y,
      size: 11,
      font: contexto.fontBold,
      color: COR_SUAVE,
    });

    contexto.y -= 24;
  }

  private desenharIdentificacaoPaciente(params: GerarDocumentoPdfParams, contexto: ContextoPdf): void {
    const { paciente } = params;
    const linhas = [
      `Paciente: ${paciente.nome}`,
      `CPF: ${paciente.cpfFormatado}   Nascimento: ${this.formatarData(paciente.dataNascimento)} (${paciente.idade} anos)   Sexo: ${paciente.sexoLabel}`,
    ];

    for (const linha of linhas) {
      contexto.page.drawText(this.limitar(linha, contexto.font, 10, LARGURA_A4 - MARGEM * 2), {
        x: MARGEM,
        y: contexto.y,
        size: 10,
        font: contexto.font,
        color: COR_TEXTO,
      });
      contexto.y -= 15;
    }

    contexto.y -= 8;
  }

  private desenharCorpo(params: GerarDocumentoPdfParams, contexto: ContextoPdf): void {
    const conteudo = params.conteudo;

    switch (params.tipo) {
      case 'receita': {
        this.escrever(contexto, 'Prescrição:', { negrito: true });

        (conteudo.itens ?? []).forEach((item, indice) => {
          this.escrever(contexto, `${indice + 1}. ${item.medicamento}`, { negrito: true });
          this.escrever(
            contexto,
            `   Posologia: ${item.dosagem} — ${item.via} — ${item.frequencia}${item.duracao ? ` — ${item.duracao}` : ''}`,
            { recuo: 12 },
          );
          if (item.observacoes) this.escrever(contexto, `   Observações: ${item.observacoes}`, { recuo: 12 });
          contexto.y -= 6;
        });

        if (conteudo.orientacoes) {
          contexto.y -= 6;
          this.escrever(contexto, 'Orientações:', { negrito: true });
          this.escrever(contexto, conteudo.orientacoes);
        }
        break;
      }

      case 'atestado': {
        this.escrever(
          contexto,
          `Atesto, para os devidos fins, que o paciente acima identificado esteve sob meus cuidados profissionais nesta data, necessitando de afastamento de suas atividades por ${conteudo.diasAfastamento} dia(s).`,
        );
        if (conteudo.cid) this.escrever(contexto, `CID-10: ${conteudo.cid}`, { negrito: true });
        if (conteudo.finalidade) this.escrever(contexto, `Finalidade: ${conteudo.finalidade}`);
        if (conteudo.observacoes) this.escrever(contexto, `Observações: ${conteudo.observacoes}`);
        break;
      }

      case 'solicitacao_exames': {
        this.escrever(contexto, 'Solicito a realização dos seguintes exames:', { negrito: true });
        (conteudo.exames ?? []).forEach((exame) => {
          this.escrever(contexto, `• ${exame.nome}${exame.observacoes ? ` — ${exame.observacoes}` : ''}`, {
            recuo: 12,
          });
        });
        if (conteudo.justificativa) {
          contexto.y -= 6;
          this.escrever(contexto, `Indicação clínica: ${conteudo.justificativa}`);
        }
        if (conteudo.cid) this.escrever(contexto, `CID-10: ${conteudo.cid}`, { negrito: true });
        break;
      }

      case 'declaracao_comparecimento': {
        this.escrever(
          contexto,
          `Declaro, para os devidos fins, que o paciente acima identificado compareceu a esta unidade no dia ${conteudo.dataComparecimento ? this.formatarData(conteudo.dataComparecimento) : ''} para atendimento${
            conteudo.procedimento ? ` de ${conteudo.procedimento}` : ''
          }.`,
        );
        this.escrever(
          contexto,
          `Horário de entrada: ${conteudo.horaEntrada ?? '—'}    Horário de saída: ${conteudo.horaSaida ?? '—'}`,
        );
        if (conteudo.observacoes) this.escrever(contexto, `Observações: ${conteudo.observacoes}`);
        break;
      }
    }

    if (conteudo.textoLivre) {
      contexto.y -= 6;
      this.escrever(contexto, conteudo.textoLivre);
    }
  }

  private desenharAssinatura(params: GerarDocumentoPdfParams, contexto: ContextoPdf): void {
    const y = Math.max(contexto.y - 60, 170);

    contexto.page.drawLine({
      start: { x: MARGEM + 90, y },
      end: { x: LARGURA_A4 - MARGEM - 90, y },
      thickness: 0.8,
      color: COR_TEXTO,
    });

    const { profissional } = params;
    const conselho = [profissional.conselhoClasse, profissional.numeroConselho].filter(Boolean).join(' ');

    const linhas = [
      { texto: profissional.nome, size: 10, font: contexto.fontBold },
      {
        texto: `${profissional.especialidade}${conselho ? ` — ${conselho}` : ''}`,
        size: 9,
        font: contexto.font,
      },
    ];

    let offset = y - 14;
    for (const linha of linhas) {
      const largura = linha.font.widthOfTextAtSize(linha.texto, linha.size);
      contexto.page.drawText(linha.texto, {
        x: (LARGURA_A4 - largura) / 2,
        y: offset,
        size: linha.size,
        font: linha.font,
        color: COR_TEXTO,
      });
      offset -= 13;
    }

    contexto.y = y - 60;
  }

  private desenharRodape(params: GerarDocumentoPdfParams, contexto: ContextoPdf): void {
    const emissao = `Emitido em ${this.formatarDataHora(params.emitidoEm)}`;
    const rodape = `${TIPO_DOCUMENTO_LABELS[params.tipo]} ${this.numeroFormatado(params)} · ${emissao} · ${params.cabecalho.redeNome}`;

    contexto.page.drawLine({
      start: { x: MARGEM, y: 64 },
      end: { x: LARGURA_A4 - MARGEM, y: 64 },
      thickness: 0.5,
      color: COR_SUAVE,
    });

    contexto.page.drawText(this.limitar(rodape, contexto.font, 8, LARGURA_A4 - MARGEM * 2), {
      x: MARGEM,
      y: 50,
      size: 8,
      font: contexto.font,
      color: COR_SUAVE,
    });

    contexto.page.drawText(
      'Documento gerado eletronicamente pelo sistema Clínica SaaS — válido com assinatura do profissional responsável.',
      { x: MARGEM, y: 38, size: 7.5, font: contexto.font, color: COR_SUAVE },
    );
  }

  private async baixarImagem(url: string, contexto: ContextoPdf) {
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) return null;

      const bytes = new Uint8Array(await resposta.arrayBuffer());
      const tipo = resposta.headers.get('content-type') ?? '';

      if (tipo.includes('png')) return contexto.page.doc.embedPng(bytes);
      if (tipo.includes('jpeg') || tipo.includes('jpg')) return contexto.page.doc.embedJpg(bytes);

      return null;
    } catch {
      // Logotipo é opcional: a emissão segue sem ele.
      return null;
    }
  }

  private escrever(
    contexto: ContextoPdf,
    texto: string,
    opcoes: { negrito?: boolean; recuo?: number; tamanho?: number } = {},
  ): void {
    const font = opcoes.negrito ? contexto.fontBold : contexto.font;
    const size = opcoes.tamanho ?? 10;
    const recuo = opcoes.recuo ?? 0;
    const larguraMaxima = LARGURA_A4 - MARGEM * 2 - recuo;

    for (const linha of this.quebrarLinhas(texto, font, size, larguraMaxima)) {
      contexto.page.drawText(linha, {
        x: MARGEM + recuo,
        y: contexto.y,
        size,
        font,
        color: COR_TEXTO,
      });
      contexto.y -= size + 5;
    }
  }

  private quebrarLinhas(texto: string, font: PDFFont, size: number, larguraMaxima: number): string[] {
    const palavras = texto.split(/\s+/);
    const linhas: string[] = [];
    let atual = '';

    for (const palavra of palavras) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;
      if (font.widthOfTextAtSize(tentativa, size) > larguraMaxima && atual) {
        linhas.push(atual);
        atual = palavra;
      } else {
        atual = tentativa;
      }
    }

    if (atual) linhas.push(atual);
    return linhas.length > 0 ? linhas : [''];
  }

  private limitar(texto: string, font: PDFFont, size: number, larguraMaxima: number): string {
    if (font.widthOfTextAtSize(texto, size) <= larguraMaxima) return texto;

    let resultado = texto;
    while (resultado.length > 4 && font.widthOfTextAtSize(`${resultado}…`, size) > larguraMaxima) {
      resultado = resultado.slice(0, -1);
    }

    return `${resultado}…`;
  }

  private formatarData(valor: string): string {
    const data = new Date(valor.length === 10 ? `${valor}T00:00:00.000Z` : valor);
    if (Number.isNaN(data.getTime())) return valor;

    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  private formatarDataHora(valor: Date): string {
    return `${valor.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} ${valor.toLocaleTimeString(
      'pt-BR',
      { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' },
    )}`;
  }
}
