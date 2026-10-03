import type {
  ConteudoDocumento,
  ItemExame,
  ItemReceita,
} from '../../domain/value-objects/conteudo-documento.vo';
import type { TipoDocumento } from '../../domain/value-objects/tipo-documento.vo';
import type { StatusDocumento } from '../../domain/entities/documento.entity';

export type { ItemExame, ItemReceita, ConteudoDocumento };

export type DocumentoDto = {
  id: string;
  redeId: string;
  unidadeId: string;
  unidadeNome: string | null;
  pacienteId: string;
  pacienteNome: string | null;
  atendimentoId: string | null;
  profissionalId: string;
  profissionalNome: string | null;
  tipo: TipoDocumento;
  tipoLabel: string;
  numero: number;
  numeroFormatado: string;
  conteudo: ConteudoDocumento;
  status: StatusDocumento;
  statusLabel: string;
  storageBucket: string;
  storagePath: string | null;
  urlAssinada: string | null;
  emitidoEm: string | null;
  emitidoPor: string | null;
  canceladoEm: string | null;
  motivoCancelamento: string | null;
  createdAt: string;
  updatedAt: string;
  /** Numeração que o próximo documento deste tipo receberá. */
  proximoNumero?: number;
};

export type CriarDocumentoInputDto = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
  atendimentoId?: string | null;
  tipo: TipoDocumento;
  conteudo?: ConteudoDocumento;
  createdBy?: string | null;
  /** Papel do usuário — recepção só emite declaração de comparecimento (§2.4). */
  papel?: string | null;
};

export type CriarDocumentoOutputDto = DocumentoDto;

export type AtualizarDocumentoInputDto = {
  documentoId: string;
  conteudo: ConteudoDocumento;
};

export type AtualizarDocumentoOutputDto = DocumentoDto;

export type EmitirDocumentoInputDto = {
  documentoId: string;
  usuarioId: string;
  /** Quando verdadeiro, notifica o paciente com o link do documento (§4.1). */
  notificarPaciente?: boolean;
  papel?: string | null;
};

export type EmitirDocumentoOutputDto = {
  documento: DocumentoDto;
  notificacao: { enfileiradas: number; canal: string | null; motivo: string | null } | null;
};

export type CancelarDocumentoInputDto = { documentoId: string; motivo: string };
export type CancelarDocumentoOutputDto = DocumentoDto;

export type ListarDocumentosInputDto = {
  redeId: string;
  pacienteId?: string | null;
  atendimentoId?: string | null;
  profissionalId?: string | null;
  unidadeId?: string | null;
  tipo?: TipoDocumento | null;
  status?: StatusDocumento[] | null;
  de?: string | null;
  ate?: string | null;
  page?: number;
  perPage?: number;
};

export type ListarDocumentosOutputDto = { items: DocumentoDto[]; total: number };

export type ObterDocumentoInputDto = { documentoId: string };
export type ObterDocumentoOutputDto = DocumentoDto;

export type ObterLinkDocumentoInputDto = { documentoId: string; expiraEmSegundos?: number };
export type ObterLinkDocumentoOutputDto = {
  documentoId: string;
  url: string | null;
  expiraEm: string | null;
};

export type PrevisualizarDocumentoInputDto = CriarDocumentoInputDto;
export type PrevisualizarDocumentoOutputDto = {
  tipo: TipoDocumento;
  conteudo: ConteudoDocumento;
  cabecalho: {
    redeNome: string;
    unidadeNome: string;
    unidadeEndereco: string;
    unidadeTelefone: string;
    logotipoUrl: string | null;
  };
  paciente: { nome: string; cpfFormatado: string; dataNascimento: string; idade: number };
  profissional: { nome: string; especialidade: string; conselho: string | null };
  proximoNumero: number;
};
