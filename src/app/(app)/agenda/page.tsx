'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { TabelaSkeleton } from '@/client/ui/feedback';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import { ConfirmDialog } from '@/client/ui/overlay';
import { AgendaDia } from '@/client/components/agenda/agenda-dia';
import { AgendaSemana } from '@/client/components/agenda/agenda-semana';
import { DialogoAgendamento } from '@/client/components/agenda/dialogo-agendamento';
import { CardAgendamento } from '@/client/components/agenda/card-agendamento';
import { agendaService, type AgendaItemDto } from '@/client/services/agenda.service';
import { profissionalService } from '@/client/services/profissional.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { useUiStore } from '@/client/stores/ui.store';
import { formatarData, formatarDataHora, formatarHoraFuso } from '@/client/lib/format';
import {
  deslocarDias,
  deslocarSemanas,
  hojeNoFuso,
  instanteNoFuso,
  intervaloDaSemana,
  intervaloDoDia,
} from '@/client/lib/agenda';
import { STATUS_LABELS, STATUS_AGENDAMENTO } from '@/modules/scheduling/domain/value-objects/status-agendamento.vo';

const TIPOS_BLOQUEIO = [
  { valor: 'ferias', rotulo: 'Férias' },
  { valor: 'congresso', rotulo: 'Congresso / capacitação' },
  { valor: 'almoco', rotulo: 'Almoço' },
  { valor: 'manutencao', rotulo: 'Manutenção' },
  { valor: 'outro', rotulo: 'Outro' },
];

function AgendaPageInterno() {
  const parametros = useSearchParams();
  const queryClient = useQueryClient();
  const { unidadeId, unidade, timezone, carregando: carregandoUnidade } = useUnidadeAtiva();
  const { pode } = usePermissoes();

  const { dataAgenda, definirDataAgenda, visualizacaoAgenda, definirVisualizacaoAgenda } = useUiStore();
  const [profissionalId, setProfissionalId] = React.useState('todos');
  const [statusFiltro, setStatusFiltro] = React.useState('todos');
  const [dialogoAberto, setDialogoAberto] = React.useState(false);
  const [bloqueioAberto, setBloqueioAberto] = React.useState(false);
  const [detalhe, setDetalhe] = React.useState<AgendaItemDto | null>(null);

  const hoje = hojeNoFuso(timezone);
  const data = dataAgenda ?? hoje;

  const semana = React.useMemo(() => intervaloDaSemana(data, timezone), [data, timezone]);
  const periodo = React.useMemo(
    () => (visualizacaoAgenda === 'dia' ? intervaloDoDia(data, timezone) : { de: semana.de, ate: semana.ate }),
    [visualizacaoAgenda, data, timezone, semana],
  );

  const agenda = useQuery({
    queryKey: ['agenda', unidadeId, profissionalId, statusFiltro, periodo.de, periodo.ate],
    queryFn: () =>
      agendaService.listar({
        unidadeId: unidadeId ?? undefined,
        profissionalId: profissionalId === 'todos' ? undefined : profissionalId,
        de: periodo.de,
        ate: periodo.ate,
        status: statusFiltro === 'todos' ? undefined : statusFiltro,
        incluirCancelados: true,
        perPage: 500,
      }),
    enabled: Boolean(unidadeId),
  });

  const profissionais = useQuery({
    queryKey: ['profissionais', { ativo: true }],
    queryFn: () => profissionalService.listar({ ativo: true }),
  });

  const pacienteInicialId = parametros.get('pacienteId');
  const pacienteInicial = useQuery({
    queryKey: ['paciente', pacienteInicialId],
    queryFn: () => import('@/client/services/paciente.service').then((mod) => mod.pacienteService.obter(pacienteInicialId as string)),
    enabled: Boolean(pacienteInicialId),
  });

  React.useEffect(() => {
    if (pacienteInicialId) setDialogoAberto(true);
  }, [pacienteInicialId]);

  const itens = React.useMemo(() => agenda.data ?? [], [agenda.data]);
  const porProfissional = React.useMemo(() => {
    if (profissionalId !== 'todos') return undefined;
    const mapa = new Map<string, { id: string; nome: string; cor?: string | null }>();
    for (const item of itens) {
      if (!mapa.has(item.profissionalId)) {
        mapa.set(item.profissionalId, {
          id: item.profissionalId,
          nome: item.profissionalNome ?? 'Profissional',
          cor: item.profissionalCorAgenda,
        });
      }
    }
    return [...mapa.values()];
  }, [itens, profissionalId]);

  const dataFormatada = formatarData(data);

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Agenda"
        descricao={`${visualizacaoAgenda === 'dia' ? dataFormatada : `semana de ${formatarData(semana.dias[0])}`} · ${unidade?.nome ?? 'todas as unidades'} · fuso ${timezone}`}
        acoes={
          <>
            {pode('agenda:criar') ? (
              <Button variant="outline" onClick={() => setBloqueioAberto(true)}>
                <CalendarX2 aria-hidden />
                Bloquear horário
              </Button>
            ) : null}
            {pode('agenda:criar') ? (
              <Button onClick={() => setDialogoAberto(true)} disabled={!unidadeId}>
                <CalendarPlus aria-hidden />
                Novo agendamento
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:p-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Período anterior"
              onClick={() =>
                definirDataAgenda(
                  visualizacaoAgenda === 'dia' ? deslocarDias(data, -1) : deslocarSemanas(data, -1),
                )
              }
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button variant="outline" onClick={() => definirDataAgenda(hoje)}>
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próximo período"
              onClick={() =>
                definirDataAgenda(
                  visualizacaoAgenda === 'dia' ? deslocarDias(data, 1) : deslocarSemanas(data, 1),
                )
              }
            >
              <ChevronRight aria-hidden />
            </Button>
            <Input
              type="date"
              value={data}
              onChange={(evento) => definirDataAgenda(evento.target.value)}
              className="w-40"
              aria-label="Data de referência"
            />
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <Select value={profissionalId} onValueChange={setProfissionalId}>
              <SelectTrigger className="lg:w-64" aria-label="Filtrar por profissional">
                <SelectValue placeholder="Todos os profissionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os profissionais</SelectItem>
                {(profissionais.data?.items ?? []).map((profissional) => (
                  <SelectItem key={profissional.id} value={profissional.id}>
                    {profissional.nome} — {profissional.especialidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="lg:w-44" aria-label="Filtrar por status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_AGENDAMENTO.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="inline-flex rounded-md border p-0.5">
              <Button
                variant={visualizacaoAgenda === 'dia' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => definirVisualizacaoAgenda('dia')}
              >
                <List aria-hidden />
                Dia
              </Button>
              <Button
                variant={visualizacaoAgenda === 'semana' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => definirVisualizacaoAgenda('semana')}
              >
                <LayoutGrid aria-hidden />
                Semana
              </Button>
            </div>

            <Badge variant="outline">{itens.length} agendamento(s)</Badge>
          </div>
        </CardContent>
      </Card>

      {carregandoUnidade || agenda.isLoading ? (
        <TabelaSkeleton linhas={6} />
      ) : visualizacaoAgenda === 'dia' ? (
        <AgendaDia
          data={data}
          timezone={timezone}
          agendamentos={itens}
          profissionais={porProfissional}
          aoAbrirDetalhes={setDetalhe}
        />
      ) : (
        <AgendaSemana
          dias={semana.dias}
          timezone={timezone}
          agendamentos={itens}
          aoAbrirDetalhes={setDetalhe}
        />
      )}

      {unidadeId ? (
        <DialogoAgendamento
          aberto={dialogoAberto}
          aoMudar={setDialogoAberto}
          unidadeId={unidadeId}
          timezone={timezone}
          dataInicial={data}
          pacienteInicial={pacienteInicial.data ?? null}
          profissionalInicialId={profissionalId === 'todos' ? null : profissionalId}
        />
      ) : null}

      <DialogBloqueio
        aberto={bloqueioAberto}
        aoMudar={setBloqueioAberto}
        unidadeId={unidadeId}
        timezone={timezone}
        dataInicial={data}
      />

      <Dialog open={Boolean(detalhe)} onOpenChange={(aberto) => !aberto && setDetalhe(null)}>
        <DialogContent tamanho="md">
          <DialogHeader>
            <DialogTitle>{detalhe?.pacienteNome ?? 'Agendamento'}</DialogTitle>
            <DialogDescription>
              {detalhe ? `${formatarDataHora(detalhe.inicio)} — ${formatarHoraFuso(detalhe.fim, timezone)}` : ''}
            </DialogDescription>
          </DialogHeader>
          {detalhe ? <CardAgendamento agendamento={detalhe} timezone={timezone} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DialogBloqueio({
  aberto,
  aoMudar,
  unidadeId,
  timezone,
  dataInicial,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  unidadeId: string | null;
  timezone: string;
  dataInicial: string;
}) {
  const queryClient = useQueryClient();
  const [profissionalId, setProfissionalId] = React.useState('');
  const [tipo, setTipo] = React.useState('outro');
  const [data, setData] = React.useState(dataInicial);
  const [diaInteiro, setDiaInteiro] = React.useState(true);
  const [horaInicio, setHoraInicio] = React.useState('12:00');
  const [horaFim, setHoraFim] = React.useState('13:00');
  const [motivo, setMotivo] = React.useState('');
  const [confirmarRemocao, setConfirmarRemocao] = React.useState<string | null>(null);

  React.useEffect(() => setData(dataInicial), [dataInicial, aberto]);

  const profissionais = useQuery({
    queryKey: ['profissionais', { ativo: true }],
    queryFn: () => profissionalService.listar({ ativo: true }),
    enabled: aberto,
  });

  const bloqueios = useQuery({
    queryKey: ['bloqueios', unidadeId, profissionalId, data],
    queryFn: () =>
      agendaService.listarBloqueios({
        unidadeId: unidadeId ?? undefined,
        profissionalId: profissionalId || undefined,
        de: intervaloDoDia(data, timezone).de,
        ate: intervaloDoDia(data, timezone).ate,
      }),
    enabled: aberto && Boolean(unidadeId),
  });

  const criar = useMutation({
    mutationFn: () => {
      if (!unidadeId || !profissionalId) throw new Error('Selecione a unidade e o profissional');

      return agendaService.criarBloqueio({
        unidadeId,
        profissionalId,
        tipo,
        motivo: motivo || null,
        inicio: diaInteiro ? instanteNoFuso(data, '00:00', timezone) : instanteNoFuso(data, horaInicio, timezone),
        fim: diaInteiro ? instanteNoFuso(data, '23:59', timezone) : instanteNoFuso(data, horaFim, timezone),
      });
    },
    onSuccess: () => {
      toast.success('Bloqueio criado');
      setMotivo('');
      queryClient.invalidateQueries({ queryKey: ['bloqueios'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const remover = useMutation({
    mutationFn: (bloqueioId: string) => agendaService.removerBloqueio(bloqueioId),
    onSuccess: () => {
      toast.success('Bloqueio removido');
      setConfirmarRemocao(null);
      queryClient.invalidateQueries({ queryKey: ['bloqueios'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent tamanho="md">
        <DialogHeader>
          <DialogTitle>Bloquear horário</DialogTitle>
          <DialogDescription>
            Bloqueios impedem novos agendamentos no período — úteis para férias, almoço e manutenção.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Profissional *</Label>
            <Select value={profissionalId} onValueChange={setProfissionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {(profissionais.data?.items ?? []).map((profissional) => (
                  <SelectItem key={profissional.id} value={profissional.id}>
                    {profissional.nome} — {profissional.especialidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloqueio-tipo">Motivo do bloqueio</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="bloqueio-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_BLOQUEIO.map((item) => (
                  <SelectItem key={item.valor} value={item.valor}>
                    {item.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloqueio-data">Data *</Label>
            <Input id="bloqueio-data" type="date" value={data} onChange={(evento) => setData(evento.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={diaInteiro}
              onChange={(evento) => setDiaInteiro(evento.target.checked)}
              className="size-4 rounded border-input"
            />
            Bloquear o dia inteiro
          </label>

          {!diaInteiro ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="bloqueio-inicio">Início</Label>
                <Input
                  id="bloqueio-inicio"
                  type="time"
                  value={horaInicio}
                  onChange={(evento) => setHoraInicio(evento.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloqueio-fim">Fim</Label>
                <Input
                  id="bloqueio-fim"
                  type="time"
                  value={horaFim}
                  onChange={(evento) => setHoraFim(evento.target.value)}
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bloqueio-motivo">Observação</Label>
            <Textarea
              id="bloqueio-motivo"
              rows={2}
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={() => criar.mutate()}
          carregando={criar.isPending}
          disabled={!profissionalId || !unidadeId}
        >
          <Plus aria-hidden />
          Criar bloqueio
        </Button>

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Bloqueios nesta data</p>
          {bloqueios.isLoading ? (
            <TabelaSkeleton linhas={2} />
          ) : (bloqueios.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum bloqueio registrado.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {(bloqueios.data ?? []).map((bloqueio) => (
                <li key={bloqueio.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {bloqueio.tipoLabel} · {bloqueio.profissionalNome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {bloqueio.diaInteiro
                        ? 'Dia inteiro'
                        : `${formatarHoraFuso(bloqueio.inicio, timezone)}–${formatarHoraFuso(bloqueio.fim, timezone)}`}
                      {bloqueio.motivo ? ` · ${bloqueio.motivo}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover bloqueio"
                    onClick={() => setConfirmarRemocao(bloqueio.id)}
                  >
                    <RotateCcw aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ConfirmDialog
          aberto={Boolean(confirmarRemocao)}
          aoMudar={(aberto) => !aberto && setConfirmarRemocao(null)}
          titulo="Remover bloqueio"
          descricao="O período volta a ficar disponível para agendamentos."
          textoConfirmar="Remover"
          carregando={remover.isPending}
          onConfirmar={() => confirmarRemocao && remover.mutate(confirmarRemocao)}
        />
      </DialogContent>
    </Dialog>
  );
}

/** `useSearchParams` exige um limite de Suspense na rota (§App Router). */
export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Carregando agenda…
        </div>
      }
    >
      <AgendaPageInterno />
    </Suspense>
  );
}
