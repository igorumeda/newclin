import type {
  DistribuicaoItem,
  SerieTemporalPonto,
} from '../../domain/repositories/relatorio-repository.interface';

export type RelatorioAtendimentosResponseDto = {
  inicio: string;
  fim: string;
  total: number;
  serie: SerieTemporalPonto[];
  porTipo: DistribuicaoItem[];
  porEspecialidade: DistribuicaoItem[];
};
