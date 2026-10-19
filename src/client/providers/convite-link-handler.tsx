'use client';

import { useEffect } from 'react';

/** Compatibilidade com convites antigos ou redirecionados ao Site URL. */
export function ConviteLinkHandler() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    if (
      hash.get('type') === 'recovery' ||
      (query.get('type') === 'recovery' && query.has('token_hash'))
    ) {
      if (window.location.pathname !== '/redefinir-senha')
        window.location.replace(
          `/redefinir-senha${window.location.search}${window.location.hash}`,
        );
      return;
    }
    if (window.location.pathname === '/convite') return;
    if (
      hash.get('type') === 'invite' ||
      (query.get('type') === 'invite' && query.has('token_hash'))
    ) {
      window.location.replace(`/convite${window.location.search}${window.location.hash}`);
    }
  }, []);
  return null;
}
