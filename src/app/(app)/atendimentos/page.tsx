'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope } from 'lucide-react';
import { PageHeader } from '@/client/ui/page-header';
import { Card, CardContent } from '@/client/ui/card';
import { Button } from '@/client/ui/button';
import { Badge } from '@/client/ui/badge';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/client/ui/table';
import { prontuarioService } from '@/client/services/prontuario.service';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { useAuth } from '@/client/providers/auth-provider';
import { useDebounce } from '@/client/hooks/use-debounce';
import { formatarDataHora } from '@/client/lib/format';
import { toDateInputValue } from '@/client/lib/utils';

function AtendimentosPageInterno() {
  const parametros = useSearchParams();
  const { unidadeId } = useUnidadeAtiva();
  const { ehProfissional } = usePermissoes();
  const { profissionalId: profissionalDoUsuario } = useAuth();

  const [termoPaciente, setTermoPaciente] = React.useState('');
  const [status, setStatus] = React.useState('todos');
  const [periodo, setPeriodo] = React.useState<'7' | '30' | '90'>('30');
  const termoDebounced = useDebounce(termoPaciente, 400);

  const pacienteId = parametros.get('pacienteId') ?? undefined;
  const agendamentoId = parametros.get('agendamentoId') ?? undefined;

  const hoje = toDateInputValue(new Date());
  const de = toDateInputValue(new Date(Date.now() - Number(periodo) * 24 * 60 * 60 * 1000));

  const consulta = useQuery({
    queryKey: ['atendimentos', { unidadeId, pacienteId, agendamentoId, status, de, hoje, profissionalDoUsuario }],
    queryFn: () =>
      prontuarioService.listarAtendimentos({
        unidadeId: unidadeId ?? undefined,
        pacienteId,
        profissionalId: ehProfissional && profissionalDoUsuario ? profissionalDoUsuario : undefined,
        status: status === 'todos' ? undefined : status,
        de,
        ate: `${hoje}T23:59:59.999Z`,
        perPage: 50,
      }),
  });

  const itens = consulta.data?.items ?? [];
  const filtrados = termoDebounced
    ? itens.filter((item) =>
        (item.pacienteNome ?? '').toLowerCase().includes(termoDebounced.toLowerCase()),
      )
    : itens;

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Atendimentos"
        descricao="Prontuários em rascunho e finalizados. A finalização torna o registro imutável; correções entram como adendo."
        acoes={
          <Button asChild>
            <Link href="/agenda">
              <Stethoscope aria-hidden />
              Iniciar pela agenda
            </Link>
          </Button>
        }
      >
        {agendamentoId ? (
          <p className="text-xs text-warning">
            Abra o agendamento na agenda e clique em <strong>Atender</strong> para iniciar o prontuário
            vinculado.
          </p>
        ) : null}
      </PageHeader>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filtro-paciente" className="text-xs">
              Paciente
            </Label>
            <Input
              id="filtro-paciente"
              value={termoPaciente}
              onChange={(evento) => setTermoPaciente(evento.target.value)}
              placeholder="Filtrar por nome"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Período</Label>
            <Select value={periodo} onValueChange={(valor) => setPeriodo(valor as '7' | '30' | '90')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="rascunho">Em rascunho</SelectItem>
                <SelectItem value="finalizado">Finalizados</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {consulta.isLoading ? (
        <TabelaSkeleton linhas={6} />
      ) : filtrados.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum atendimento no período"
          descricao="Os atendimentos são criados a partir da agenda (botão Atender) ou pela recepção, ao registrar a chegada do paciente."
          icone={Stethoscope}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((atendimento) => (
                  <TableRow key={atendimento.id}>
                    <TableCell className="font-medium">{atendimento.pacienteNome ?? '—'}</TableCell>
                    <TableCell>{atendimento.profissionalNome ?? '—'}</TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {formatarDataHora(atendimento.iniciadoEm)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {atendimento.templateNome ?? '—'}
                      {atendimento.templateVersao ? (
                        <span className="text-xs text-muted-foreground"> v{atendimento.templateVersao}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={atendimento.finalizado ? 'success' : 'warning'}>
                        {atendimento.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/atendimentos/${atendimento.id}`}>
                          {atendimento.finalizado ? 'Ver prontuário' : 'Continuar'}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** `useSearchParams` exige um limite de Suspense na rota (§App Router). */
export default function AtendimentosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Carregando atendimentos…
        </div>
      }
    >
      <AtendimentosPageInterno />
    </Suspense>
  );
}
