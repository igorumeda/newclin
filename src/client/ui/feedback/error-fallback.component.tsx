'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export type ErrorFallbackProps = { titulo?: string; mensagem: string; aoTentarNovamente?: () => void };

export function ErrorFallback({
  titulo = 'Algo deu errado',
  mensagem,
  aoTentarNovamente,
}: ErrorFallbackProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" aria-hidden />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>{mensagem}</span>
        {aoTentarNovamente ? (
          <Button size="sm" variant="outline" onClick={aoTentarNovamente}>
            Tentar novamente
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
