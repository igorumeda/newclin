import type {
  CamposFixosAtendimento,
  DadosPreenchidos,
  FontePagadora,
} from '../../../domain/entities/atendimento.entity';

export type FinalizarAtendimentoInputDto = {
  redeId: string;
  id: string;
  dadosPreenchidos?: DadosPreenchidos;
  camposFixos?: Partial<CamposFixosAtendimento>;
  fontePagadora?: FontePagadora;
};
