'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { ConciergeBell, UserCheck } from 'lucide-react';
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
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { EmptyState } from '@/client/ui/typography/empty-state.component';
import { LoadingSkeleton } from '@/client/ui/feedback/loading-skeleton.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { unidadeApiService } from '@/modules/unidade/client/services/unidade-api.service';
import { agendaApiService } from '../../services/agenda-api.service';
import { StatusBadge } from '../components/status-badge.component';

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function hora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

export function RecepcaoPage() {
  const queryClient = useQueryClient();
  const [data, setData] = useState(hoje());
  const [unidadeId, setUnidadeId] = useState<string>('');

  const unidades = useQuery({
    queryKey: ['unidades', 'ativas'],
    queryFn: async () => {
      const lista = await unidadeApiService.listar({ apenasAtivas: true });
      if (!unidadeId && lista.length > 0) setUnidadeId(lista[0].id);
      return lista;
    },
  });

  const painel = useQuery({
    queryKey: ['recepcao', unidadeId, data],
    queryFn: () =>
      agendaApiService.painelRecepcao({
        unidadeId,
        data: new Date(`${data}T12:00:00`).toISOString(),
      }),
    enabled: Boolean(unidadeId),
    refetchInterval: 60_000,
  });

  const checkin = useMutation({
    mutationFn: (id: string) => agendaApiService.registrarCheckin({ id }),
    onSuccess: () => {
      toast.success('Check-in registrado');
      void queryClient.invalidateQueries({ queryKey: ['recepcao'] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const iniciar = useMutation({
    mutationFn: (id: string) =>
      agendaApiService.alterarStatus({ id, status: 'em_atendimento' }),
    onSuccess: () => {
      toast.success('Atendimento iniciado');
      void queryClient.invalidateQueries({ queryKey: ['recepcao'] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <PageContainer>
      <PageTitle
        titulo="Painel da recepção"
        descricao="Chegada dos pacientes, fila de espera e início dos atendimentos."
      />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <FormField rotulo="Unidade">
            <Select value={unidadeId} onValueChange={setUnidadeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidades.data?.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField rotulo="Data">
            <Input type="date" value={data} onChange={(evento) => setData(evento.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      {painel.isLoading ? (
        <LoadingSkeleton linhas={5} />
      ) : !painel.data || painel.data.filas.every((fila) => fila.agendamentos.length === 0) ? (
        <EmptyState
          titulo="Nenhum paciente na agenda deste dia"
          icone={<ConciergeBell className="h-8 w-8" aria-hidden />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {painel.data.filas.map((fila) => (
            <Card key={fila.status} className="flex flex-col">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">{fila.titulo}</CardTitle>
                <Badge variant="secondary">{fila.agendamentos.length}</Badge>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {fila.agendamentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Fila vazia</p>
                ) : (
                  fila.agendamentos.map((agendamento) => (
                    <div key={agendamento.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{agendamento.paciente.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {hora(agendamento.inicio)} · {agendamento.profissional.nome}
                          </p>
                        </div>
                        <StatusBadge status={agendamento.status} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {['agendado', 'confirmado'].includes(agendamento.status) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => checkin.mutate(agendamento.id)}
                          >
                            <UserCheck className="h-4 w-4" aria-hidden />
                            Check-in
                          </Button>
                        ) : null}
                        {agendamento.status === 'aguardando' ? (
                          <Button size="sm" onClick={() => iniciar.mutate(agendamento.id)}>
                            Iniciar atendimento
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
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
