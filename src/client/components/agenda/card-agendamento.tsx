'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  LogIn,
  Play,
  Stethoscope,
  UserX,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/client/lib/utils';
import { formatarHoraFuso } from '@/client/lib/format';
import { STATUS_LABELS, transicaoPermitida, type StatusAgendamento } from '@/modules/scheduling/domain/value-objects/status-agendamento.vo';
import { StatusAgendamentoBadge, CorTipoAtendimento } from '@/client/ui/status-badge';
import { Badge } from '@/client/ui/badge';
import { Button } from '@/client/ui/button';
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/client/ui/overlay';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { agendaService, type AgendaItemDto } from '@/client/services/agenda.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { usePermissoes } from '@/client/hooks/use-permissoes';

/** Ações de fluxo disponíveis no card, respeitando as transições do §3.4. */
const FLUXO: { de: StatusAgendamento[]; para: StatusAgendamento; rotulo: string; icone: React.ElementType }[] = [
  { de: ['agendado'], para: 'confirmado', rotulo: 'Confirmar', icone: CheckCircle2 },
  { de: ['agendado'], para: 'aguardando', rotulo: 'Registrar chegada', icone: LogIn },
  { de: ['confirmado'], para: 'aguardando', rotulo: 'Registrar chegada', icone: LogIn },
  { de: ['confirmado', 'aguardando'], para: 'em_atendimento', rotulo: 'Iniciar atendimento', icone: Play },
  { de: ['em_atendimento'], para: 'finalizado', rotulo: 'Finalizar', icone: CheckCircle2 },
  { de: ['agendado', 'confirmado', 'aguardando'], para: 'faltou', rotulo: 'Marcar falta', icone: UserX },
];

export type CardAgendamentoProps = {
  agendamento: AgendaItemDto;
  timezone?: string;
  compacto?: boolean;
  aoAbrirDetalhes?: (agendamento: AgendaItemDto) => void;
};

export function CardAgendamento({ agendamento, timezone, compacto = false, aoAbrirDetalhes }: CardAgendamentoProps) {
  const queryClient = useQueryClient();
  const { pode } = usePermissoes();

  const [cancelando, setCancelando] = React.useState(false);
  const [motivo, setMotivo] = React.useState('');
  const [confirmandoFalta, setConfirmandoFalta] = React.useState(false);

  const cor = agendamento.tipoAtendimentoCor ?? agendamento.profissionalCorAgenda ?? undefined;

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['agenda'] });
    queryClient.invalidateQueries({ queryKey: ['recepcao'] });
    queryClient.invalidateQueries({ queryKey: ['relatorios'] });
  };

  const alterarStatus = useMutation({
    mutationFn: (entrada: { novoStatus: StatusAgendamento; motivo?: string | null }) =>
      agendaService.alterarStatus(agendamento.id, entrada),
    onSuccess: (atualizado) => {
      toast.success(`Agendamento marcado como ${STATUS_LABELS[atualizado.status].toLowerCase()}`);
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const cancelar = useMutation({
    mutationFn: () => agendaService.cancelar(agendamento.id, motivo),
    onSuccess: () => {
      toast.success('Agendamento cancelado');
      setCancelando(false);
      setMotivo('');
      invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const acoesDisponiveis = FLUXO.filter(
    (acao) =>
      acao.de.includes(agendamento.status) &&
      transicaoPermitida(agendamento.status, acao.para) &&
      pode(acao.para === 'em_atendimento' || acao.para === 'finalizado' ? 'prontuario:escrever' : 'recepcao:operar'),
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-colors',
        agendamento.encaixe && 'border-dashed border-warning/70',
      )}
      style={cor ? { borderLeftWidth: 4, borderLeftColor: cor } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CorTipoAtendimento cor={agendamento.tipoAtendimentoCor} />
            <p className="truncate text-sm font-semibold tabular-nums">
              {formatarHoraFuso(agendamento.inicio, timezone)} – {formatarHoraFuso(agendamento.fim, timezone)}
            </p>
            {agendamento.encaixe ? <Badge variant="warning">encaixe</Badge> : null}
          </div>

          <button
            type="button"
            onClick={() => aoAbrirDetalhes?.(agendamento)}
            className="mt-1 block max-w-full truncate text-left text-sm font-medium hover:text-primary hover:underline"
          >
            {agendamento.pacienteNome ?? 'Paciente'}
          </button>

          {!compacto ? (
            <p className="truncate text-xs text-muted-foreground">
              {agendamento.profissionalNome}
              {agendamento.tipoAtendimentoNome ? ` · ${agendamento.tipoAtendimentoNome}` : ''}
              {agendamento.duracaoMinutos ? ` · ${agendamento.duracaoMinutos} min` : ''}
            </p>
          ) : null}

          {agendamento.pacienteTelefone && !compacto ? (
            <p className="truncate text-xs text-muted-foreground">{agendamento.pacienteTelefone}</p>
          ) : null}

          {agendamento.tempoEsperaMinutos !== null && agendamento.status === 'aguardando' ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-warning">
              <Clock className="size-3" aria-hidden />
              aguardando há {agendamento.tempoEsperaMinutos} min
            </p>
          ) : null}

          {agendamento.motivoCancelamento ? (
            <p className="mt-1 text-xs text-destructive">Motivo: {agendamento.motivoCancelamento}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <StatusAgendamentoBadge status={agendamento.status} />

          {acoesDisponiveis.length > 0 || pode('agenda:cancelar') ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ações do agendamento">
                  <CalendarClock aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Fluxo de atendimento</DropdownMenuLabel>
                {acoesDisponiveis.map((acao) => (
                  <DropdownMenuItem
                    key={acao.para}
                    onClick={() =>
                      acao.para === 'faltou'
                        ? setConfirmandoFalta(true)
                        : alterarStatus.mutate({ novoStatus: acao.para })
                    }
                  >
                    <acao.icone aria-hidden />
                    {acao.rotulo}
                  </DropdownMenuItem>
                ))}
                {pode('agenda:cancelar') ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variante="destructive" onClick={() => setCancelando(true)}>
                      <Ban aria-hidden />
                      Cancelar agendamento
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {!compacto && agendamento.observacoes ? (
        <p className="line-clamp-2 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
          {agendamento.observacoes}
        </p>
      ) : null}

      {!compacto && (pode('prontuario:ler') || pode('pacientes:ler')) ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {pode('pacientes:ler') ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/pacientes/${agendamento.pacienteId}`}>Ficha do paciente</Link>
            </Button>
          ) : null}
          {pode('prontuario:escrever') ? (
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={!['aguardando', 'em_atendimento', 'confirmado'].includes(agendamento.status)}
            >
              <Link href={`/atendimentos?agendamentoId=${agendamento.id}`}>
                <Stethoscope aria-hidden />
                Atender
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <Dialog open={cancelando} onOpenChange={setCancelando}>
        <DialogContent tamanho="sm">
          <DialogHeader>
            <DialogTitle>Cancelar agendamento</DialogTitle>
            <DialogDescription>
              O motivo é registrado na auditoria e pode ser enviado ao paciente pelas notificações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-cancelamento">Motivo *</Label>
            <Textarea
              id="motivo-cancelamento"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              rows={3}
              placeholder="Ex.: paciente solicitou reagendamento"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setCancelando(false)}>
              <X aria-hidden />
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={motivo.trim().length < 3}
              carregando={cancelar.isPending}
              onClick={() => cancelar.mutate()}
            >
              <Ban aria-hidden />
              Confirmar cancelamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={confirmandoFalta}
        aoMudar={setConfirmandoFalta}
        titulo="Registrar falta do paciente"
        descricao="A falta entra nos relatórios de absenteísmo e o horário é liberado na agenda."
        textoConfirmar="Registrar falta"
        carregando={alterarStatus.isPending}
        onConfirmar={() => {
          alterarStatus.mutate({ novoStatus: 'faltou' });
          setConfirmandoFalta(false);
        }}
      />

      {agendamento.encaixe && agendamento.encaixeJustificativa ? (
        <p className="flex items-start gap-1 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
          {agendamento.encaixeJustificativa}
        </p>
      ) : null}
    </div>
  );
}
