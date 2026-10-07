'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  Stethoscope,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { EmptyState } from '@/client/ui/typography/empty-state.component';
import { LoadingSkeleton } from '@/client/ui/feedback/loading-skeleton.component';
import { StatCard } from '@/client/ui/data-display/stat-card.component';
import { useAutenticacao } from '@/client/providers/auth-provider';
import { agendaApiService } from '@/modules/agenda/client/services/agenda-api.service';
import { relatorioApiService } from '../../services/relatorio-api.service';

function inicioDoDia(): string {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  return data.toISOString();
}

function fimDoDia(): string {
  const data = new Date();
  data.setHours(23, 59, 59, 999);
  return data.toISOString();
}

function hora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

export function DashboardPage() {
  const { usuario } = useAutenticacao();

  const indicadores = useQuery({
    queryKey: ['relatorios', 'indicadores'],
    queryFn: () => relatorioApiService.indicadores({}),
  });

  const agendaHoje = useQuery({
    queryKey: ['agenda', 'hoje'],
    queryFn: () => agendaApiService.listarAgendamentos({ inicio: inicioDoDia(), fim: fimDoDia() }),
  });

  return (
    <PageContainer>
      <PageTitle
        titulo={`Olá, ${usuario?.nome.split(' ')[0] ?? ''}`}
        descricao="Visão geral da rede no dia de hoje."
        acoes={
          <Button asChild>
            <Link href="/agenda">Abrir agenda</Link>
          </Button>
        }
      />

      {indicadores.isLoading ? (
        <LoadingSkeleton linhas={2} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            titulo="Consultas hoje"
            valor={indicadores.data?.atendimentosHoje ?? 0}
            icone={<CalendarDays className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            titulo="Aguardando atendimento"
            valor={indicadores.data?.aguardando ?? 0}
            descricao={`${indicadores.data?.emAtendimento ?? 0} em atendimento`}
            icone={<Clock className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            titulo="Finalizados hoje"
            valor={indicadores.data?.finalizadosHoje ?? 0}
            descricao={`Taxa de conclusão ${indicadores.data?.taxaOcupacao ?? 0}%`}
            icone={<CalendarCheck className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            titulo="Pacientes ativos"
            valor={indicadores.data?.pacientesAtivos ?? 0}
            descricao={`${indicadores.data?.proximosSete ?? 0} consultas nos próximos 7 dias`}
            icone={<Users className="h-5 w-5" aria-hidden />}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agenda de hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {agendaHoje.isLoading ? (
            <LoadingSkeleton linhas={4} />
          ) : (agendaHoje.data?.agendamentos.length ?? 0) === 0 ? (
            <EmptyState
              titulo="Nenhuma consulta para hoje"
              descricao="Agende um atendimento para começar."
              icone={<Stethoscope className="h-8 w-8" aria-hidden />}
              acao={
                <Button asChild variant="outline">
                  <Link href="/agenda">Ir para a agenda</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y">
              {agendaHoje.data?.agendamentos.slice(0, 12).map((agendamento) => (
                <li key={agendamento.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-14 font-mono text-sm tabular-nums">
                    {hora(agendamento.inicio)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {agendamento.paciente.nome}
                  </span>
                  <span className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground sm:block">
                    {agendamento.profissional.nome} · {agendamento.tipoAtendimento.nome}
                  </span>
                  {agendamento.encaixe ? <Badge variant="warning">Encaixe</Badge> : null}
                  <Badge variant="secondary">{agendamento.status.replace('_', ' ')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
