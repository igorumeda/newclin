'use client';

import * as React from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { formatarData } from '@/client/lib/format';
import { HORA_FIM_GRADE, HORA_INICIO_GRADE, minutosDoDia } from '@/client/lib/agenda';
import { EstadoVazio } from '@/client/ui/feedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { CardAgendamento } from './card-agendamento';
import type { AgendaItemDto } from '@/client/services/agenda.service';

const ALTURA_HORA = 72;

export type AgendaDiaProps = {
  data: string;
  timezone: string;
  agendamentos: AgendaItemDto[];
  carregando?: boolean;
  aoAbrirDetalhes?: (agendamento: AgendaItemDto) => void;
  /** Quando informado, a grade é dividida por profissional. */
  profissionais?: { id: string; nome: string; cor?: string | null }[];
};

/** Visão diária: grade horária por profissional (§3.4). */
export function AgendaDia({
  data,
  timezone,
  agendamentos,
  carregando = false,
  aoAbrirDetalhes,
  profissionais,
}: AgendaDiaProps) {
  const horas = React.useMemo(
    () => Array.from({ length: HORA_FIM_GRADE - HORA_INICIO_GRADE }, (_, indice) => HORA_INICIO_GRADE + indice),
    [],
  );

  const colunas = React.useMemo(() => {
    if (profissionais && profissionais.length > 0) return profissionais;

    const mapa = new Map<string, { id: string; nome: string; cor?: string | null }>();
    for (const agendamento of agendamentos) {
      if (!mapa.has(agendamento.profissionalId)) {
        mapa.set(agendamento.profissionalId, {
          id: agendamento.profissionalId,
          nome: agendamento.profissionalNome ?? 'Profissional',
          cor: agendamento.profissionalCorAgenda,
        });
      }
    }
    return [...mapa.values()];
  }, [profissionais, agendamentos]);

  if (!carregando && agendamentos.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhum atendimento nesta data"
        descricao={`Não há agendamentos para ${formatarData(data)}. Use "Novo agendamento" para incluir, ou verifique bloqueios e horários dos profissionais.`}
        icone={CalendarDays}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          {formatarData(data)} · {agendamentos.length} agendamento(s)
        </CardTitle>
        <Badge variant="outline">fuso {timezone}</Badge>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 sm:p-0">
        <div className="flex min-w-max">
          <div className="w-16 shrink-0 border-r">
            {horas.map((hora) => (
              <div
                key={hora}
                className="relative border-b text-right text-[11px] tabular-nums text-muted-foreground"
                style={{ height: ALTURA_HORA }}
              >
                <span className="absolute right-2 top-1">{String(hora).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {colunas.map((coluna) => {
            const itens = agendamentos
              .filter((agendamento) => agendamento.profissionalId === coluna.id)
              .filter(
                (agendamento) =>
                  !['cancelado', 'faltou'].includes(agendamento.status) || agendamento.status === 'faltou',
              );

            return (
              <div key={coluna.id} className="min-w-[16rem] flex-1 border-r last:border-r-0">
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card px-3 py-2">
                  <span
                    aria-hidden
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: coluna.cor ?? 'hsl(var(--primary))' }}
                  />
                  <span className="truncate text-sm font-medium">{coluna.nome}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {itens.length}
                  </Badge>
                </div>

                <div className="relative" style={{ height: (HORA_FIM_GRADE - HORA_INICIO_GRADE) * ALTURA_HORA }}>
                  {horas.map((hora) => (
                    <div key={hora} className="border-b" style={{ height: ALTURA_HORA }} />
                  ))}

                  {itens.map((agendamento) => {
                    const minutos = minutosDoDia(agendamento.inicio, timezone);
                    const topo = ((minutos - HORA_INICIO_GRADE * 60) / 60) * ALTURA_HORA;
                    const altura = Math.max(48, (agendamento.duracaoMinutos / 60) * ALTURA_HORA - 4);

                    return (
                      <div
                        key={agendamento.id}
                        className="absolute left-1.5 right-1.5"
                        style={{ top: Math.max(0, topo) + 2, height: altura }}
                      >
                        <CardAgendamento
                          agendamento={agendamento}
                          timezone={timezone}
                          compacto
                          aoAbrirDetalhes={aoAbrirDetalhes}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
