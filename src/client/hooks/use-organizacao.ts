'use client';

import { useQuery } from '@tanstack/react-query';
import { organizacaoService } from '@/client/services/organizacao.service';

/** Dados da rede (nome, logotipo, tema) usados no cabeçalho e nos documentos. */
type UseOrganizacaoParams = { enabled?: boolean };
export function useOrganizacao({ enabled = true }: UseOrganizacaoParams = {}) {
  const query = useQuery({
    queryKey: ['organizacao'],
    queryFn: () => organizacaoService.obter(),
    staleTime: 10 * 60 * 1000,
    retry: false,
    enabled,
  });

  return {
    organizacao: query.data ?? null,
    carregando: query.isLoading,
    erro: query.error,
    recarregar: query.refetch,
  };
}
