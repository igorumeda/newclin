'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, Ban, CheckCircle2, Clock3, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { EmptyState } from '@/client/ui/typography/empty-state.component';
import { LoadingSkeleton } from '@/client/ui/feedback/loading-skeleton.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { profissionalApiService } from '@/modules/profissional/client/services/profissional-api.service';
import { unidadeApiService } from '@/modules/unidade/client/services/unidade-api.service';
import { TRANSICOES_PERMITIDAS } from '../../../domain/value-objects/status-agendamento.vo';
import type { StatusAgendamentoValue } from '../../../domain/value-objects/status-agendamento.vo';
import type { AgendamentoDetalhado } from '../../../domain/repositories/agenda-consulta-repository.interface';
import { agendaApiService } from '../../services/agenda-api.service';
import { StatusBadge } from '../components/status-badge.component';
import { NovoAgendamentoForm } from '../forms/novo-agendamento.form';

type Visao = 'dia' | 'semana';
type PeriodoAgenda = { inicio: string; fim: string };

function dataIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function calcularPeriodo(dataBase: string, visao: Visao): PeriodoAgenda {
  const inicio = new Date(`${dataBase}T00:00:00`);
  if (visao === 'semana') {
    inicio.setDate(inicio.getDate() - inicio.getDay());
  }
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + (visao === 'semana' ? 7 : 1));
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

function formatarDia(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso));
}

export function AgendaPage() {
  const queryClient = useQueryClient();
  const [dataBase, setDataBase] = useState(dataIso(new Date()));
  const [visao, setVisao] = useState<Visao>('dia');
  const [unidadeId, setUnidadeId] = useState<string>('todas');
  const [profissionalId, setProfissionalId] = useState<string>('todos');
  const [dialogoAberto, setDialogoAberto] = useState(false);

  const periodo = useMemo(() => calcularPeriodo(dataBase, visao), [dataBase, visao]);

  const unidades = useQuery({
    queryKey: ['unidades', 'ativas'],
    queryFn: () => unidadeApiService.listar({ apenasAtivas: true }),
  });
  const profissionais = useQuery({
    queryKey: ['profissionais', 'ativos'],
    queryFn: () => profissionalApiService.listar({ apenasAtivos: true }),
  });

  const agenda = useQuery({
    queryKey: ['agenda', periodo, unidadeId, profissionalId],
    queryFn: () =>
      agendaApiService.listarAgendamentos({
        inicio: periodo.inicio,
        fim: periodo.fim,
        unidadeId: unidadeId === 'todas' ? null : unidadeId,
        profissionalId: profissionalId === 'todos' ? null : profissionalId,
      }),
  });

  const alterarStatus = useMutation({
    mutationFn: (params: { id: string; status: StatusAgendamentoValue }) =>
      agendaApiService.alterarStatus({
        id: params.id,
        status: params.status,
        motivo:
          params.status === 'cancelado' ? 'Cancelado pela equipe na agenda' : undefined,
      }),
    onSuccess: () => {
      toast.success('Status atualizado');
      void queryClient.invalidateQueries({ queryKey: ['agenda'] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const agrupados = useMemo(() => {
    const mapa = new Map<string, AgendamentoDetalhado[]>();
    (agenda.data?.agendamentos ?? []).forEach((agendamento) => {
      const chave = agendamento.inicio.slice(0, 10);
      const atual = mapa.get(chave) ?? [];
      mapa.set(chave, [...atual, agendamento]);
    });
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [agenda.data]);

  return (
    <PageContainer>
      <PageTitle
        titulo="Agenda"
        descricao="Visualize, confirme e acompanhe os atendimentos da rede."
        acoes={
          <Button onClick={() => setDialogoAberto(true)}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Novo agendamento
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <FormField rotulo="Data">
            <Input
              type="date"
              value={dataBase}
              onChange={(evento) => setDataBase(evento.target.value)}
            />
          </FormField>

          <FormField rotulo="Unidade">
            <Select value={unidadeId} onValueChange={setUnidadeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as unidades</SelectItem>
                {unidades.data?.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField rotulo="Profissional">
            <Select value={profissionalId} onValueChange={setProfissionalId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os profissionais</SelectItem>
                {profissionais.data?.map((profissional) => (
                  <SelectItem key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex items-end">
            <Tabs value={visao} onValueChange={(valor) => setVisao(valor as Visao)}>
              <TabsList>
                <TabsTrigger value="dia">Dia</TabsTrigger>
                <TabsTrigger value="semana">Semana</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {(agenda.data?.bloqueios.length ?? 0) > 0 ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban className="h-4 w-4" aria-hidden />
              Bloqueios no período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {agenda.data?.bloqueios.map((bloqueio) => (
              <p key={bloqueio.id}>
                {formatarDia(bloqueio.inicio)} · {formatarHora(bloqueio.inicio)}–
                {formatarHora(bloqueio.fim)} — {bloqueio.motivo}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {agenda.isLoading ? (
        <LoadingSkeleton linhas={6} />
      ) : agrupados.length === 0 ? (
        <EmptyState
          titulo="Nenhum agendamento no período"
          descricao="Ajuste os filtros ou crie um novo agendamento."
          icone={<Stethoscope className="h-8 w-8" aria-hidden />}
        />
      ) : (
        <div className="space-y-6">
          {agrupados.map(([dia, itens]) => (
            <Card key={dia}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base capitalize">
                  {formatarDia(`${dia}T12:00:00`)} · {itens.length} atendimento(s)
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {itens.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex w-full items-center gap-3 sm:w-48">
                      <span
                        className="h-10 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: agendamento.profissional.corAgenda }}
                        aria-hidden
                      />
                      <div>
                        <p className="font-mono text-sm font-medium tabular-nums">
                          {formatarHora(agendamento.inicio)} – {formatarHora(agendamento.fim)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agendamento.tipoAtendimento.nome}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{agendamento.paciente.nome}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {agendamento.profissional.nome} · {agendamento.unidade.nome}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {agendamento.encaixe ? (
                        <Badge variant="warning" title="Encaixe fora da grade">
                          Encaixe
                        </Badge>
                      ) : null}
                      <StatusBadge status={agendamento.status} />

                      {TRANSICOES_PERMITIDAS[agendamento.status].includes('confirmado') ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            alterarStatus.mutate({ id: agendamento.id, status: 'confirmado' })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Confirmar
                        </Button>
                      ) : null}

                      {TRANSICOES_PERMITIDAS[agendamento.status].includes('aguardando') ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            alterarStatus.mutate({ id: agendamento.id, status: 'aguardando' })
                          }
                        >
                          <Clock3 className="h-4 w-4" aria-hidden />
                          Check-in
                        </Button>
                      ) : null}

                      {agendamento.atendimentoId ? (
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/atendimentos/${agendamento.atendimentoId}`}>
                            Prontuário
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NovoAgendamentoForm
        aberto={dialogoAberto}
        dataSugerida={dataBase}
        aoFechar={() => setDialogoAberto(false)}
      />
    </PageContainer>
  );
}
