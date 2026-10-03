'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { PageHeader } from '@/client/ui/page-header';
import { Card, CardContent } from '@/client/ui/card';
import { Input } from '@/client/ui/input';
import { Button } from '@/client/ui/button';
import { EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { PainelRecepcao } from '@/client/components/recepcao/painel-recepcao';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { deslocarDias, hojeNoFuso } from '@/client/lib/agenda';

export default function RecepcaoPage() {
  const { unidadeId, unidade, timezone, carregando } = useUnidadeAtiva();
  const [data, setData] = React.useState<string | null>(null);

  const hoje = hojeNoFuso(timezone);
  const dataSelecionada = data ?? hoje;

  if (carregando) return <TabelaSkeleton linhas={6} />;

  if (!unidadeId) {
    return (
      <EstadoVazio
        titulo="Selecione uma unidade"
        descricao="A recepção opera no contexto de uma unidade específica. Escolha a unidade no topo da página."
        icone={CalendarDays}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Recepção"
        descricao={`Fila de atendimento, check-in e ordem de chegada — ${unidade?.nome ?? 'unidade'} · fuso ${timezone}.`}
        acoes={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setData(deslocarDias(dataSelecionada, -1))}>
              Dia anterior
            </Button>
            <Button variant="outline" onClick={() => setData(hoje)}>
              Hoje
            </Button>
            <Button variant="outline" onClick={() => setData(deslocarDias(dataSelecionada, 1))}>
              Próximo dia
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <label htmlFor="recepcao-data" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Data de atendimento
            </label>
            <Input
              id="recepcao-data"
              type="date"
              value={dataSelecionada}
              onChange={(evento) => setData(evento.target.value)}
              className="sm:w-48"
            />
          </div>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            O painel lista os agendamentos por ordem de chegada e atualiza os tempos de espera automaticamente.
          </p>
        </CardContent>
      </Card>

      <PainelRecepcao unidadeId={unidadeId} timezone={timezone} data={dataSelecionada} />
    </div>
  );
}
