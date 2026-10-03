'use client';

import { useQuery } from '@tanstack/react-query';
import { organizacaoService } from '@/client/services/organizacao.service';

/** Dados da rede (nome, logotipo, tema) usados no cabeçalho e nos documentos. */
export function useOrganizacao() {
  const query = useQuery({
    queryKey: ['organizacao'],
    queryFn: () => organizacaoService.obter(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  return { organizacao: query.data ?? null, carregando: query.isLoading, recarregar: query.refetch };
}
