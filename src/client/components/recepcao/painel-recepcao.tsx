'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlarmClock,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  LogIn,
  Stethoscope,
  UserPlus,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/client/ui/badge';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Alert, AlertDescription, EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { StatCard } from '@/client/ui/page-header';
import { ConfirmDialog } from '@/client/ui/overlay';
import { CorTipoAtendimento, StatusAgendamentoBadge } from '@/client/ui/status-badge';
import { agendaService, type AgendaItemDto } from '@/client/services/agenda.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { formatarData, formatarHoraFuso } from '@/client/lib/format';

export type PainelRecepcaoProps = {
  unidadeId: string;
  timezone: string;
  data: string;
};

export function PainelRecepcao({ unidadeId, timezone, data }: PainelRecepcaoProps) {
  const queryClient = useQueryClient();
  const { pode } = usePermissoes();
  const [faltaConfirmada, setFaltaConfirmada] = React.useState<AgendaItemDto | null>(null);

  const painel = useQuery({
    queryKey: ['recepcao', 'painel', unidadeId, data],
    queryFn: () => agendaService.painelRecepcao({ unidadeId, data }),
    refetchInterval: 30_000,
  });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['recepcao'] });
    queryClient.invalidateQueries({ queryKey: ['agenda'] });
  }

  const checkIn = useMutation({
    mutationFn: (agendamentoId: string) => agendaService.registrarChegada(agendamentoId),
    onSuccess: (agendamento, agendamentoId) => {
      const ordem = agendamento.ordemChegada ? ` · posição ${agendamento.ordemChegada}` : '';
      toast.success(`Chegada registrada${ordem}`);
      invalidar();
      void agendamentoId;
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const alterarStatus = useMutation({
    mutationFn: (entrada: { agendamentoId: string; novoStatus: 'confirmado' | 'em_atendimento' | 'finalizado' | 'faltou' }) =>
      agendaService.alterarStatus(entrada.agendamentoId, { novoStatus: entrada.novoStatus }),
    onSuccess: (agendamento) => {
      toast.success(`Status atualizado para ${agendamento.statusLabel.toLowerCase()}`);
      setFaltaConfirmada(null);
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const dados = painel.data;

  if (painel.isLoading) return <TabelaSkeleton linhas={6} />;

  if (painel.isError || !dados) {
    return (
      <EstadoVazio
        titulo="Não foi possível carregar o painel"
        descricao="Verifique se a unidade está selecionada e tente novamente."
        icone={ClipboardList}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Aguardando" valor={dados.indicadores.aguardando} icone={Clock} />
        <StatCard titulo="Em atendimento" valor={dados.indicadores.emAtendimento} icone={Stethoscope} />
        <StatCard
          titulo="Tempo médio de espera"
          valor={`${dados.indicadores.tempoMedioEsperaMinutos} min`}
          icone={AlarmClock}
        />
        <StatCard titulo="Faltas" valor={dados.indicadores.faltas} icone={UserX} />
      </div>

      <Alert variant="info">
        <AlertDescription>
          Painel do dia {formatarData(dados.data)} · {dados.indicadores.total} agendamento(s) ·{' '}
          {dados.indicadores.confirmados} confirmado(s) · atualização automática a cada 30 segundos.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 xl:grid-cols-3">
        <Coluna
          titulo="Aguardando atendimento"
          descricao="Ordem de chegada — quem espera há mais tempo aparece primeiro."
          itens={dados.aguardando}
          timezone={timezone}
          destaque
          acoes={(item) => (
            <>
              {pode('recepcao:operar') ? (
                <Button
                  size="sm"
                  onClick={() => alterarStatus.mutate({ agendamentoId: item.id, novoStatus: 'em_atendimento' })}
                  carregando={alterarStatus.isPending}
                >
                  <ArrowRight aria-hidden />
                  Chamar
                </Button>
              ) : null}
              {pode('recepcao:operar') ? (
                <Button variant="ghost" size="sm" onClick={() => setFaltaConfirmada(item)}>
                  <UserX aria-hidden />
                  Faltou
                </Button>
              ) : null}
            </>
          )}
          vazio={{
            titulo: 'Nenhum paciente aguardando',
            descricao: 'Os pacientes aparecem aqui após o check-in na recepção.',
          }}
        />

        <Coluna
          titulo="A chegar"
          descricao="Agendamentos confirmados e ainda sem check-in."
          itens={dados.aChegar}
          timezone={timezone}
          acoes={(item) =>
            pode('recepcao:operar') ? (
              <>
                <Button
                  size="sm"
                  onClick={() => checkIn.mutate(item.id)}
                  carregando={checkIn.isPending && checkIn.variables === item.id}
                >
                  <LogIn aria-hidden />
                  Check-in
                </Button>
                {item.status === 'agendado' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alterarStatus.mutate({ agendamentoId: item.id, novoStatus: 'confirmado' })}
                  >
                    <CheckCircle2 aria-hidden />
                    Confirmar
                  </Button>
                ) : null}
              </>
            ) : null
          }
          vazio={{ titulo: 'Nada previsto', descricao: 'Nenhum paciente a chegar para o restante do dia.' }}
        />

        <Coluna
          titulo="Em atendimento"
          descricao="Consultas em andamento neste momento."
          itens={dados.emAtendimento}
          timezone={timezone}
          acoes={(item) => (
            <>
              {pode('prontuario:escrever') ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/atendimentos?agendamentoId=${item.id}`}>
                    <Stethoscope aria-hidden />
                    Prontuário
                  </Link>
                </Button>
              ) : null}
            </>
          )}
          vazio={{ titulo: 'Nenhum atendimento em andamento', descricao: '' }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Coluna
          titulo="Finalizados hoje"
          itens={dados.finalizados}
          timezone={timezone}
          compacto
          vazio={{ titulo: 'Nenhum atendimento finalizado ainda', descricao: '' }}
        />
        <Coluna
          titulo="Ausências e cancelamentos"
          itens={dados.ausentes}
          timezone={timezone}
          compacto
          vazio={{ titulo: 'Sem faltas registradas hoje', descricao: '' }}
        />
      </div>

      {pode('recepcao:operar') ? (
        <Card>
          <CardHeader>
            <CardTitle>Cadastro rápido</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/pacientes/novo">
                <UserPlus aria-hidden />
                Novo paciente
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/agenda">
                <ClipboardList aria-hidden />
                Abrir agenda do dia
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        aberto={Boolean(faltaConfirmada)}
        aoMudar={(aberto) => !aberto && setFaltaConfirmada(null)}
        titulo="Registrar falta"
        descricao={`Confirmar que ${faltaConfirmada?.pacienteNome ?? 'o paciente'} não compareceu? A falta alimenta os relatórios de absenteísmo.`}
        textoConfirmar="Registrar falta"
        carregando={alterarStatus.isPending}
        onConfirmar={() =>
          faltaConfirmada && alterarStatus.mutate({ agendamentoId: faltaConfirmada.id, novoStatus: 'faltou' })
        }
      />
    </div>
  );
}

type ColunaProps = {
  titulo: string;
  descricao?: string;
  itens: AgendaItemDto[];
  timezone: string;
  destaque?: boolean;
  compacto?: boolean;
  acoes?: (item: AgendaItemDto) => React.ReactNode;
  vazio: { titulo: string; descricao?: string };
};

function Coluna({
  titulo,
  descricao,
  itens,
  timezone,
  destaque = false,
  compacto = false,
  acoes,
  vazio,
}: ColunaProps) {
  return (
    <Card className={destaque ? 'border-primary/40' : undefined}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm">{titulo}</CardTitle>
          {descricao ? <p className="mt-1 text-xs text-muted-foreground">{descricao}</p> : null}
        </div>
        <Badge variant={itens.length > 0 ? 'default' : 'secondary'}>{itens.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {itens.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">{vazio.titulo}</p>
        ) : (
          itens.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CorTipoAtendimento cor={item.tipoAtendimentoCor} />
                  <span className="text-sm font-medium tabular-nums">
                    {formatarHoraFuso(item.inicio, timezone)}
                  </span>
                  <StatusAgendamentoBadge status={item.status} />
                  {item.encaixe ? <Badge variant="warning">encaixe</Badge> : null}
                </div>
                <button
                  type="button"
                  className="mt-1 block max-w-full truncate text-left text-sm font-medium hover:text-primary hover:underline"
                  onClick={() => window.open(`/pacientes/${item.pacienteId}`, '_self')}
                >
                  {item.pacienteNome}
                </button>
                {!compacto ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {item.profissionalNome}
                    {item.tipoAtendimentoNome ? ` · ${item.tipoAtendimentoNome}` : ''}
                  </p>
                ) : null}
                {item.tempoEsperaMinutos !== null && item.status === 'aguardando' ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-warning">
                    <Clock className="size-3" aria-hidden />
                    espera de {item.tempoEsperaMinutos} min
                  </p>
                ) : null}
                {item.ordemChegada ? (
                  <p className="text-xs text-muted-foreground">posição de chegada #{item.ordemChegada}</p>
                ) : null}
              </div>
              {acoes ? <div className="flex shrink-0 flex-wrap gap-1.5">{acoes(item)}</div> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
