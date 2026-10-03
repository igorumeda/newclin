'use client';

import { CalendarRange } from 'lucide-react';
import { formatarData, formatarHoraFuso } from '@/client/lib/format';
import { formatarDataIso } from '@/client/lib/agenda';
import { EstadoVazio } from '@/client/ui/feedback';
import { Card, CardContent } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { StatusAgendamentoBadge, CorTipoAtendimento } from '@/client/ui/status-badge';
import type { AgendaItemDto } from '@/client/services/agenda.service';

export type AgendaSemanaProps = {
  dias: string[];
  timezone: string;
  agendamentos: AgendaItemDto[];
  carregando?: boolean;
  aoAbrirDetalhes?: (agendamento: AgendaItemDto) => void;
};

/** Visão semanal: um dia por coluna, ordenado por horário (§3.4). */
export function AgendaSemana({ dias, timezone, agendamentos, carregando = false, aoAbrirDetalhes }: AgendaSemanaProps) {
  if (!carregando && agendamentos.length === 0) {
    return (
      <EstadoVazio
        titulo="Semana sem agendamentos"
        descricao="Não encontramos atendimentos nesta semana para os filtros selecionados."
        icone={CalendarRange}
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      {dias.map((dia) => {
        const doDia = agendamentos
          .filter((agendamento) => formatarDataIso(new Date(agendamento.inicio), timezone) === dia)
          .sort((a, b) => a.inicio.localeCompare(b.inicio));

        return (
          <Card key={dia} className="flex flex-col">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">{formatarData(dia)}</span>
              <Badge variant={doDia.length > 0 ? 'default' : 'secondary'}>{doDia.length}</Badge>
            </div>
            <CardContent className="flex-1 space-y-2 p-2">
              {doDia.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">livre</p>
              ) : (
                doDia.map((agendamento) => (
                  <button
                    key={agendamento.id}
                    type="button"
                    onClick={() => aoAbrirDetalhes?.(agendamento)}
                    className="w-full rounded-md border bg-card p-2 text-left text-xs transition-colors hover:bg-accent"
                    style={
                      agendamento.tipoAtendimentoCor
                        ? { borderLeftWidth: 3, borderLeftColor: agendamento.tipoAtendimentoCor }
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      <CorTipoAtendimento cor={agendamento.tipoAtendimentoCor} />
                      <span className="font-medium tabular-nums">
                        {formatarHoraFuso(agendamento.inicio, timezone)}
                      </span>
                    </span>
                    <span className="mt-1 block truncate font-medium">{agendamento.pacienteNome}</span>
                    <span className="mt-0.5 block truncate text-muted-foreground">
                      {agendamento.profissionalNome}
                    </span>
                    <span className="mt-1 block">
                      <StatusAgendamentoBadge status={agendamento.status} />
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
