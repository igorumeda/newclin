import type { ConteudoDocumento } from '../../../domain/entities/documento.entity';

export type CriarDocumentoInputDto = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  atendimentoId?: string | null;
  profissionalId: string;
  tipo: string;
  conteudo: ConteudoDocumento;
};
