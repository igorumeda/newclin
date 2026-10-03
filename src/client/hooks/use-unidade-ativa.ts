'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizacaoService } from '@/client/services/organizacao.service';
import { useAuth } from '@/client/providers/auth-provider';
import { useUnidadeStore } from '@/client/stores/unidade.store';
import type { UnidadeDto } from '@/modules/organization/application/dtos/organizacao.dto';

export type UseUnidadeAtivaResult = {
  unidades: UnidadeDto[];
  unidade: UnidadeDto | null;
  unidadeId: string | null;
  timezone: string;
  carregando: boolean;
  definirUnidade: (unidadeId: string) => void;
  /** `true` quando o usuário enxerga mais de uma unidade (seletor visível). */
  multiplas: boolean;
};

/**
 * Unidade ativa do usuário: considera as unidades permitidas (`unidades_acesso`)
 * e mantém a escolha entre navegações. Perfis com uma única unidade não veem seletor.
 */
export function useUnidadeAtiva(): UseUnidadeAtivaResult {
  const { unidadesAcesso, carregando: carregandoAuth } = useAuth();
  const { unidadeId, definirUnidade } = useUnidadeStore();

  const { data, isLoading } = useQuery({
    queryKey: ['organizacao', 'unidades', { ativo: true }],
    queryFn: () => organizacaoService.listarUnidades({ ativo: true }),
    staleTime: 10 * 60 * 1000,
    enabled: !carregandoAuth,
  });

  const unidades = useMemo(() => {
    const lista = data ?? [];
    const permitidas = unidadesAcesso ?? [];
    return permitidas.length > 0 ? lista.filter((unidade) => permitidas.includes(unidade.id)) : lista;
  }, [data, unidadesAcesso]);

  useEffect(() => {
    if (unidades.length === 0) return;
    const aindaValida = unidadeId && unidades.some((unidade) => unidade.id === unidadeId);
    if (!aindaValida) definirUnidade(unidades[0].id);
  }, [unidades, unidadeId, definirUnidade]);

  const unidade = useMemo(
    () => unidades.find((item) => item.id === unidadeId) ?? unidades[0] ?? null,
    [unidades, unidadeId],
  );

  return {
    unidades,
    unidade,
    unidadeId: unidade?.id ?? null,
    timezone: unidade?.timezone ?? 'America/Sao_Paulo',
    carregando: isLoading || carregandoAuth,
    definirUnidade,
    multiplas: unidades.length > 1,
  };
}
