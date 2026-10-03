'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, type PerfilAtual } from '../services/auth.service';
import type { Permission } from '@/modules/user/domain/value-objects/role.vo';

export type AuthContextValue = {
  carregando: boolean;
  perfil: PerfilAtual | null;
  usuarioId: string | null;
  nome: string | null;
  email: string | null;
  papel: string | null;
  redeId: string | null;
  unidadesAcesso: string[];
  profissionalId: string | null;
  /** Verificação de permissão para exibir/ocultar ações (§2.3). */
  pode: (permissao: Permission) => boolean;
  atualizarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'perfil'],
    queryFn: () => authService.perfil(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const sair = useCallback(async () => {
    await authService.logout();
    queryClient.setQueryData(['auth', 'perfil'], null);
    queryClient.clear();
  }, [queryClient]);

  const atualizarPerfil = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value = useMemo<AuthContextValue>(() => {
    const permissoes = data?.permissoes ?? [];
    const usuario = data?.usuario ?? null;

    return {
      carregando: isLoading,
      perfil: data ?? null,
      usuarioId: usuario?.id ?? null,
      nome: usuario?.nome ?? null,
      email: usuario?.email ?? null,
      papel: usuario?.role ?? null,
      redeId: usuario?.redeId ?? null,
      unidadesAcesso: usuario?.unidadesAcesso ?? [],
      profissionalId: usuario?.profissionalId ?? null,
      pode: (permissao: Permission) => permissoes.includes(permissao),
      atualizarPerfil,
      sair,
    };
  }, [data, isLoading, atualizarPerfil, sair]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return contexto;
}
