'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { podePermissao } from '@/modules/auth/domain/value-objects/papel.vo';
import type { Permissao } from '@/modules/auth/domain/value-objects/papel.vo';
import type { SessaoUsuario } from '@/modules/auth/client/services/auth-api.service';

export type ContextoAutenticacao = {
  usuario: SessaoUsuario | null;
  pode: (permissao: Permissao) => boolean;
};

export type AuthProviderProps = { usuario: SessaoUsuario | null; children: ReactNode };

const AuthContext = createContext<ContextoAutenticacao>({ usuario: null, pode: () => false });

export function AuthProvider({ usuario, children }: AuthProviderProps) {
  const valor = useMemo<ContextoAutenticacao>(
    () => ({
      usuario,
      pode: (permissao: Permissao) =>
        usuario ? podePermissao({ role: usuario.role, permissao }) : false,
    }),
    [usuario],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAutenticacao(): ContextoAutenticacao {
  return useContext(AuthContext);
}
