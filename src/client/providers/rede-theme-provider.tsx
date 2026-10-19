'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { useOrganizacao } from '../hooks/use-organizacao';
import { Button } from '../ui/button';
import {
  aplicarTemaDaRede,
  carregarLogotipo,
  REDE_TEMA_STYLE_ID,
} from '../styles/rede-identidade';

type RedeThemeProviderProps = { children: ReactNode };

/** Só libera a aplicação quando identidade visual e logotipo estiverem prontos. */
export function RedeThemeProvider({ children }: RedeThemeProviderProps) {
  const {
    redeId,
    carregando: carregandoPerfil,
    perfil,
    atualizarPerfil,
    sair,
  } = useAuth();
  const {
    organizacao,
    erro: erroOrganizacao,
    recarregar,
  } = useOrganizacao({ enabled: Boolean(redeId) });
  const [pronta, setPronta] = useState<string | null>(null);
  const [erroLogo, setErroLogo] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const chave =
    organizacao && organizacao.id === redeId
      ? JSON.stringify([organizacao.id, organizacao.tema, organizacao.logotipoUrl])
      : null;

  useEffect(
    () => () => {
      document.getElementById(REDE_TEMA_STYLE_ID)?.remove();
    },
    [],
  );

  useEffect(() => {
    if (!organizacao || !chave) return;
    const controller = new AbortController();
    setErroLogo(false);
    aplicarTemaDaRede({ tema: organizacao.tema });
    void carregarLogotipo({ url: organizacao.logotipoUrl, signal: controller.signal })
      .then(() => {
        if (!controller.signal.aborted) setPronta(chave);
      })
      .catch(() => {
        if (!controller.signal.aborted) setErroLogo(true);
      });
    return () => controller.abort();
  }, [organizacao, chave, tentativa]);

  if (chave && pronta === chave && perfil) return <>{children}</>;

  const erro =
    !carregandoPerfil &&
    (!perfil ||
      erroOrganizacao ||
      erroLogo ||
      (organizacao && organizacao.id !== redeId));
  return (
    <div className="auth-screen flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        {erro ? (
          <>
            <p role="alert" className="text-sm">
              Não foi possível carregar as configurações da sua rede.
            </p>
            <Button
              onClick={() => {
                setPronta(null);
                setErroLogo(false);
                setTentativa((valor) => valor + 1);
                void atualizarPerfil();
                void recarregar();
              }}
            >
              Tentar novamente
            </Button>
            <Button
              variant="link"
              onClick={async () => {
                await sair();
                window.location.assign('/login');
              }}
            >
              Voltar ao login
            </Button>
          </>
        ) : (
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            Carregando…
          </p>
        )}
      </div>
    </div>
  );
}
