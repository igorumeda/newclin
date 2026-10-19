'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Percent,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';
import { PageHeader, StatCard } from '@/client/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Button } from '@/client/ui/button';
import { EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { DataTable } from '@/client/ui/data-table';
import { StatusAgendamentoBadge } from '@/client/ui/status-badge';
import { GraficoLinha } from '@/client/components/shared/graficos';
import { relatorioService } from '@/client/services/relatorio.service';
import { agendaService, type AgendaItemDto } from '@/client/services/agenda.service';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { formatarData, formatarHora, formatarNumero, formatarPercentual } from '@/client/lib/format';
import { toDateInputValue } from '@/client/lib/utils';
import { intervaloDoDia } from '@/client/lib/agenda';
import type { ColumnDef } from '@tanstack/react-table';

const colunasHoje: ColumnDef<AgendaItemDto, unknown>[] = [
  {
    id: 'horario',
    header: 'Horário',
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatarHora(row.original.inicio)}</span>,
  },
  {
    id: 'paciente',
    header: 'Paciente',
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.pacienteNome}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.tipoAtendimentoNome}</p>
      </div>
    ),
  },
  {
    id: 'profissional',
    header: 'Profissional',
    cell: ({ row }) => <span className="text-sm">{row.original.profissionalNome}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusAgendamentoBadge status={row.original.status} />,
  },
];

export default function DashboardPage() {
  const { unidadeId } = useUnidadeAtiva();
  const { ehGestao, ehClinico } = usePermissoes();

  const hoje = toDateInputValue(new Date());
  const trintaDiasAtras = toDateInputValue(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));

  const indicadores = useQuery({
    queryKey: ['relatorios', 'dashboard', unidadeId],
    queryFn: () => relatorioService.dashboard({ unidadeId: unidadeId ?? undefined }),
    enabled: ehGestao,
    refetchInterval: 60 * 1000,
  });

  const atendimentosPeriodo = useQuery({
    queryKey: ['relatorios', 'atendimentos', unidadeId, trintaDiasAtras, hoje],
    queryFn: () => relatorioService.atendimentos({ inicio: trintaDiasAtras, fim: hoje, unidadeId: unidadeId ?? undefined }),
    enabled: ehGestao,
  });

  const agendaHoje = useQuery({
    queryKey: ['agenda', unidadeId, hoje],
    queryFn: () =>
      agendaService.listar({
        unidadeId: unidadeId ?? undefined,
        ...intervaloDoDia(hoje),
      }),
    enabled: Boolean(unidadeId),
  });

  const dados = indicadores.data;

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Painel"
        descricao={`Visão do dia ${formatarData(hoje)}${unidadeId ? '' : ' — todas as unidades'}.`}
        acoes={
          <>
            <Button variant="outline" asChild>
              <Link href="/recepcao">
                <ClipboardList aria-hidden />
                Recepção
              </Link>
            </Button>
            <Button asChild>
              <Link href="/agenda">
                <CalendarDays aria-hidden />
                Agenda
              </Link>
            </Button>
          </>
        }
      />

      {ehGestao ? (
        indicadores.isLoading ? (
          <TabelaSkeleton linhas={2} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard titulo="Consultas hoje" valor={formatarNumero(dados?.consultasHoje)} icone={CalendarClock} />
            <StatCard titulo="Aguardando" valor={formatarNumero(dados?.pacientesAguardando)} icone={Users} />
            <StatCard titulo="Em atendimento" valor={formatarNumero(dados?.emAtendimento)} icone={Stethoscope} />
            <StatCard titulo="Pacientes ativos" valor={formatarNumero(dados?.pacientesAtivos)} icone={UserCheck} />
            <StatCard titulo="Profissionais ativos" valor={formatarNumero(dados?.profissionaisAtivos)} icone={Users} />
            <StatCard
              titulo="Faltas (30 dias)"
              valor={formatarPercentual(dados?.taxaFaltas30d)}
              icone={Percent}
              descricao="sobre agendamentos finalizados"
            />
          </div>
        )
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Agenda de hoje</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agenda">Ver agenda completa</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              colunas={colunasHoje}
              dados={agendaHoje.data ?? []}
              carregando={agendaHoje.isLoading}
              estadoVazio={
                <EstadoVazio
                  titulo="Nenhum atendimento agendado para hoje"
                  descricao="Use a agenda para incluir encaixes e novos agendamentos."
                  icone={CalendarDays}
                />
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atendimentos nos últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            {ehGestao && atendimentosPeriodo.data?.linhas?.length ? (
              <GraficoLinha
                dados={atendimentosPeriodo.data.linhas.map((linha) => ({
                  rotulo: formatarData(linha.data).slice(0, 5),
                  valor: linha.totalFinalizados,
                }))}
                chaveValor="finalizados"
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {ehGestao ? 'Sem dados no período.' : 'Indicadores disponíveis para gestão e administração.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {ehClinico ? (
        <Card>
          <CardHeader>
            <CardTitle>Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/pacientes/novo">Cadastrar paciente</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/atendimentos">Meus atendimentos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/documentos">Emitir documento</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
