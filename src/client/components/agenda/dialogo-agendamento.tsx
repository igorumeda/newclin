'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarPlus, Check, Search, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/client/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/client/ui/feedback';
import { Badge } from '@/client/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/client/ui/overlay';
import { agendaService, type AgendaItemDto } from '@/client/services/agenda.service';
import { pacienteService, type PacienteDto } from '@/client/services/paciente.service';
import { profissionalService } from '@/client/services/profissional.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useDebounce } from '@/client/hooks/use-debounce';
import { formatarData, formatarHoraFuso } from '@/client/lib/format';
import { instanteNoFuso } from '@/client/lib/agenda';

export type DialogoAgendamentoProps = {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  unidadeId: string;
  timezone: string;
  dataInicial: string;
  /** Agendamento existente em edição. */
  agendamento?: AgendaItemDto | null;
  pacienteInicial?: PacienteDto | null;
  profissionalInicialId?: string | null;
};

export function DialogoAgendamento({
  aberto,
  aoMudar,
  unidadeId,
  timezone,
  dataInicial,
  agendamento,
  pacienteInicial,
  profissionalInicialId,
}: DialogoAgendamentoProps) {
  const queryClient = useQueryClient();

  const [paciente, setPaciente] = React.useState<PacienteDto | null>(pacienteInicial ?? null);
  const [buscaPaciente, setBuscaPaciente] = React.useState('');
  const [popoverPaciente, setPopoverPaciente] = React.useState(false);
  const [profissionalId, setProfissionalId] = React.useState(profissionalInicialId ?? '');
  const [tipoAtendimentoId, setTipoAtendimentoId] = React.useState('');
  const [data, setData] = React.useState(dataInicial);
  const [hora, setHora] = React.useState('');
  const [observacoes, setObservacoes] = React.useState('');
  const [encaixe, setEncaixe] = React.useState(false);
  const [justificativa, setJustificativa] = React.useState('');
  const [notificar, setNotificar] = React.useState(true);

  const buscaDebounced = useDebounce(buscaPaciente, 350);

  React.useEffect(() => {
    if (!aberto) return;
    setPaciente(pacienteInicial ?? null);
    setProfissionalId(profissionalInicialId ?? '');
    setTipoAtendimentoId(agendamento?.tipoAtendimentoId ?? '');
    setData(agendamento ? dataInicial : dataInicial);
    setHora(agendamento ? formatarHoraFuso(agendamento.inicio, 'UTC') : '');
    setObservacoes(agendamento?.observacoes ?? '');
    setEncaixe(false);
    setJustificativa('');
    setNotificar(true);
  }, [aberto, agendamento, pacienteInicial, profissionalInicialId, dataInicial]);

  const profissionais = useQuery({
    queryKey: ['profissionais', { ativo: true }],
    queryFn: () => profissionalService.listar({ ativo: true }),
    enabled: aberto,
  });

  const tipos = useQuery({
    queryKey: ['tipos-atendimento'],
    queryFn: () => agendaService.listarTiposAtendimento(),
    enabled: aberto,
  });

  const buscaPacientes = useQuery({
    queryKey: ['pacientes', 'busca-rapida', buscaDebounced],
    queryFn: () => pacienteService.listar({ termo: buscaDebounced, perPage: 8 }),
    enabled: aberto && buscaDebounced.trim().length >= 2,
  });

  const tipoSelecionado = (tipos.data ?? []).find((tipo) => tipo.id === tipoAtendimentoId) ?? null;
  const duracaoMinutos = tipoSelecionado?.duracaoMinutos ?? 30;

  const horarios = useQuery({
    queryKey: ['agenda', 'horarios-disponiveis', unidadeId, profissionalId, data, tipoAtendimentoId],
    queryFn: () =>
      agendaService.horariosDisponiveis({
        unidadeId,
        profissionalId,
        data,
        tipoAtendimentoId: tipoAtendimentoId || null,
      }),
    enabled: aberto && Boolean(unidadeId && profissionalId && data),
  });

  const inicioInstante = hora ? instanteNoFuso(data, hora, timezone) : '';
  const fimInstante = inicioInstante
    ? new Date(new Date(inicioInstante).getTime() + duracaoMinutos * 60_000).toISOString()
    : '';

  const conflito = useQuery({
    queryKey: [
      'agenda',
      'conflito',
      unidadeId,
      profissionalId,
      inicioInstante,
      fimInstante,
      encaixe,
      agendamento?.id,
    ],
    queryFn: () =>
      agendaService.verificarConflito({
        unidadeId,
        profissionalId,
        inicio: inicioInstante,
        fim: fimInstante,
        ignorarAgendamentoId: agendamento?.id ?? null,
        encaixe,
      }),
    enabled: aberto && Boolean(unidadeId && profissionalId && inicioInstante && fimInstante),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!paciente) throw new Error('Selecione o paciente');
      if (!profissionalId) throw new Error('Selecione o profissional');
      if (!inicioInstante) throw new Error('Selecione o horário');

      const payload = {
        unidadeId,
        pacienteId: paciente.id,
        profissionalId,
        tipoAtendimentoId: tipoAtendimentoId || null,
        inicio: inicioInstante,
        duracaoMinutos,
        observacoes: observacoes || null,
        encaixe,
        encaixeJustificativa: encaixe ? justificativa : null,
        notificarPaciente: notificar,
      };

      return agendamento
        ? agendaService.atualizar(agendamento.id, payload)
        : agendaService.criar(payload);
    },
    onSuccess: () => {
      toast.success(agendamento ? 'Agendamento atualizado' : 'Agendamento criado');
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      queryClient.invalidateQueries({ queryKey: ['recepcao'] });
      aoMudar(false);
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const conflitos = conflito.data?.conflitos ?? [];
  const bloqueios = conflito.data?.bloqueios ?? [];
  const temConflito = conflitos.length > 0 || bloqueios.length > 0;
  const podeSalvar =
    Boolean(paciente && profissionalId && inicioInstante) && (!temConflito || (encaixe && justificativa.trim().length >= 5));

  function aoEscolherPaciente(selecionado: PacienteDto) {
    setPaciente(selecionado);
    setPopoverPaciente(false);
    setBuscaPaciente('');
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent tamanho="lg">
        <DialogHeader>
          <DialogTitle>{agendamento ? 'Editar agendamento' : 'Novo agendamento'}</DialogTitle>
          <DialogDescription>
            A duração vem do tipo de atendimento. Conflitos de horário são bloqueados — encaixes exigem
            justificativa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Paciente *</Label>
            {paciente ? (
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{paciente.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {paciente.cpfFormatado} · {formatarData(paciente.dataNascimento)}
                    </p>
                  </div>
                </div>
                {!agendamento ? (
                  <Button variant="ghost" size="sm" onClick={() => setPaciente(null)}>
                    Trocar
                  </Button>
                ) : null}
              </div>
            ) : (
              <Popover open={popoverPaciente} onOpenChange={setPopoverPaciente}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <Search aria-hidden />
                    Buscar por nome ou CPF
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(28rem,90vw)] p-0" align="start">
                  <div className="border-b p-2">
                    <Input
                      autoFocus
                      value={buscaPaciente}
                      onChange={(evento) => setBuscaPaciente(evento.target.value)}
                      placeholder="Digite ao menos 2 caracteres…"
                      aria-label="Buscar paciente"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {buscaDebounced.trim().length < 2 ? (
                      <p className="p-3 text-sm text-muted-foreground">Digite o nome ou o CPF do paciente.</p>
                    ) : buscaPacientes.isLoading ? (
                      <p className="p-3 text-sm text-muted-foreground">Buscando…</p>
                    ) : (buscaPacientes.data?.items ?? []).length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
                    ) : (
                      (buscaPacientes.data?.items ?? []).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => aoEscolherPaciente(item)}
                          className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{item.nome}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.cpfFormatado} · {formatarData(item.dataNascimento)}
                            </span>
                          </span>
                          <Check className="size-4 text-primary" aria-hidden />
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agendamento-profissional">Profissional *</Label>
            <Select value={profissionalId} onValueChange={setProfissionalId}>
              <SelectTrigger id="agendamento-profissional">
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
            <Label htmlFor="agendamento-tipo">Tipo de atendimento</Label>
            <Select value={tipoAtendimentoId} onValueChange={setTipoAtendimentoId}>
              <SelectTrigger id="agendamento-tipo">
                <SelectValue placeholder="Padrão da unidade" />
              </SelectTrigger>
              <SelectContent>
                {(tipos.data ?? []).map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome} · {tipo.duracaoMinutos} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipoSelecionado ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  aria-hidden
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: tipoSelecionado.cor }}
                />
                Duração de {tipoSelecionado.duracaoMinutos} minutos
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agendamento-data">Data *</Label>
            <Input
              id="agendamento-data"
              type="date"
              value={data}
              onChange={(evento) => {
                setData(evento.target.value);
                setHora('');
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agendamento-hora">Horário *</Label>
            {horarios.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando horários…</p>
            ) : horarios.data?.slots?.length ? (
              <div className="grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto rounded-md border p-2">
                {horarios.data.slots.map((slot) => (
                  <button
                    key={slot.inicio}
                    type="button"
                    disabled={!slot.disponivel && !encaixe}
                    onClick={() => setHora(formatarHoraFuso(slot.inicio, timezone))}
                    className={`rounded-md border px-2 py-1.5 text-xs tabular-nums transition-colors ${
                      hora === formatarHoraFuso(slot.inicio, timezone)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : slot.disponivel
                          ? 'hover:bg-accent'
                          : 'cursor-not-allowed bg-muted text-muted-foreground line-through'
                    }`}
                  >
                    {formatarHoraFuso(slot.inicio, timezone)}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                type="time"
                value={hora}
                onChange={(evento) => setHora(evento.target.value)}
                aria-label="Horário do agendamento"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Os horários seguem os períodos de atendimento do profissional na unidade.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="agendamento-observacoes">Observações</Label>
            <Textarea
              id="agendamento-observacoes"
              rows={2}
              value={observacoes}
              onChange={(evento) => setObservacoes(evento.target.value)}
              placeholder="Informações para a recepção (opcional)"
            />
          </div>
        </div>

        {temConflito ? (
          <Alert variant={encaixe ? 'warning' : 'destructive'}>
            <AlertTitle>Conflito de horário detectado</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 space-y-1 text-sm">
                {conflitos.map((item) => (
                  <li key={item.agendamentoId}>
                    {item.pacienteNome} · {formatarHoraFuso(item.inicio, timezone)}–
                    {formatarHoraFuso(item.fim, timezone)} · {item.status}
                    {item.encaixe ? ' (encaixe)' : ''}
                  </li>
                ))}
                {bloqueios.map((item) => (
                  <li key={item.bloqueioId}>
                    Bloqueio: {item.tipo}
                    {item.motivo ? ` — ${item.motivo}` : ''} ·{' '}
                    {formatarHoraFuso(item.inicio, timezone)}–{formatarHoraFuso(item.fim, timezone)}
                  </li>
                ))}
              </ul>

              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={encaixe}
                  onChange={(evento) => setEncaixe(evento.target.checked)}
                  className="size-4 rounded border-input"
                />
                Realizar encaixe mesmo com conflito
              </label>

              {encaixe ? (
                <div className="mt-2 space-y-1">
                  <Label htmlFor="agendamento-justificativa" className="text-xs">
                    Justificativa do encaixe *
                  </Label>
                  <Textarea
                    id="agendamento-justificativa"
                    rows={2}
                    value={justificativa}
                    onChange={(evento) => setJustificativa(evento.target.value)}
                    placeholder="Ex.: retorno de exame com urgência avaliado pela médica"
                  />
                </div>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notificar}
            onChange={(evento) => setNotificar(evento.target.checked)}
            className="size-4 rounded border-input"
          />
          Enfileirar confirmação para o paciente (e-mail/WhatsApp)
        </label>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => aoMudar(false)}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} carregando={salvar.isPending} disabled={!podeSalvar}>
            <CalendarPlus aria-hidden />
            {agendamento ? 'Salvar alterações' : 'Agendar'}
            {temConflito && encaixe ? <Badge variant="warning">encaixe</Badge> : null}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
