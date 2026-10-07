'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/client/ui/forms/form-field.component';
import { Label } from '@/components/ui/label';
import { pacienteApiService } from '@/modules/paciente/client/services/paciente-api.service';
import { profissionalApiService } from '@/modules/profissional/client/services/profissional-api.service';
import { unidadeApiService } from '@/modules/unidade/client/services/unidade-api.service';
import { agendaApiService } from '../../services/agenda-api.service';

export type NovoAgendamentoFormProps = {
  aberto: boolean;
  dataSugerida: string;
  aoFechar: () => void;
};

type FormularioAgendamento = {
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId: string;
  data: string;
  hora: string;
  encaixe: boolean;
  observacoes: string;
};

const FORMULARIO_VAZIO: FormularioAgendamento = {
  unidadeId: '',
  profissionalId: '',
  pacienteId: '',
  tipoAtendimentoId: '',
  data: '',
  hora: '09:00',
  encaixe: false,
  observacoes: '',
};

export function NovoAgendamentoForm({ aberto, dataSugerida, aoFechar }: NovoAgendamentoFormProps) {
  const queryClient = useQueryClient();
  const [formulario, setFormulario] = useState<FormularioAgendamento>({
    ...FORMULARIO_VAZIO,
    data: dataSugerida,
  });

  const unidades = useQuery({
    queryKey: ['unidades', 'ativas'],
    queryFn: () => unidadeApiService.listar({ apenasAtivas: true }),
    enabled: aberto,
  });
  const profissionais = useQuery({
    queryKey: ['profissionais', 'ativos'],
    queryFn: () => profissionalApiService.listar({ apenasAtivos: true }),
    enabled: aberto,
  });
  const tipos = useQuery({
    queryKey: ['tipos-atendimento'],
    queryFn: () => agendaApiService.listarTiposAtendimento(),
    enabled: aberto,
  });
  const pacientes = useQuery({
    queryKey: ['pacientes', 'combo'],
    queryFn: () => pacienteApiService.listar({ apenasAtivos: true, porPagina: 100 }),
    enabled: aberto,
  });

  const criar = useMutation({
    mutationFn: () =>
      agendaApiService.criarAgendamento({
        unidadeId: formulario.unidadeId,
        profissionalId: formulario.profissionalId,
        pacienteId: formulario.pacienteId,
        tipoAtendimentoId: formulario.tipoAtendimentoId,
        inicio: new Date(`${formulario.data}T${formulario.hora}:00`).toISOString(),
        encaixe: formulario.encaixe,
        observacoes: formulario.observacoes || null,
      }),
    onSuccess: () => {
      toast.success('Agendamento criado');
      void queryClient.invalidateQueries({ queryKey: ['agenda'] });
      void queryClient.invalidateQueries({ queryKey: ['recepcao'] });
      setFormulario({ ...FORMULARIO_VAZIO, data: dataSugerida });
      aoFechar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  function alterar(campo: keyof FormularioAgendamento, valor: string | boolean): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => (!estado ? aoFechar() : undefined)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            Conflitos de horário e bloqueios são validados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField rotulo="Unidade" obrigatorio>
            <Select
              value={formulario.unidadeId}
              onValueChange={(valor) => alterar('unidadeId', valor)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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

          <FormField rotulo="Profissional" obrigatorio>
            <Select
              value={formulario.profissionalId}
              onValueChange={(valor) => alterar('profissionalId', valor)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {profissionais.data?.map((profissional) => (
                  <SelectItem key={profissional.id} value={profissional.id}>
                    {profissional.nome} — {profissional.especialidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField rotulo="Paciente" obrigatorio className="sm:col-span-2">
            <Select
              value={formulario.pacienteId}
              onValueChange={(valor) => alterar('pacienteId', valor)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {pacientes.data?.itens.map((paciente) => (
                  <SelectItem key={paciente.id} value={paciente.id}>
                    {paciente.nome} — {paciente.cpfFormatado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField rotulo="Tipo de atendimento" obrigatorio>
            <Select
              value={formulario.tipoAtendimentoId}
              onValueChange={(valor) => alterar('tipoAtendimentoId', valor)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {tipos.data?.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome} ({tipo.duracaoMinutos} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField rotulo="Data" obrigatorio>
              <Input
                type="date"
                value={formulario.data}
                onChange={(evento) => alterar('data', evento.target.value)}
              />
            </FormField>
            <FormField rotulo="Hora" obrigatorio>
              <Input
                type="time"
                value={formulario.hora}
                onChange={(evento) => alterar('hora', evento.target.value)}
              />
            </FormField>
          </div>

          <FormField rotulo="Observações" className="sm:col-span-2">
            <Textarea
              value={formulario.observacoes}
              onChange={(evento) => alterar('observacoes', evento.target.value)}
              placeholder="Informações adicionais para a recepção"
            />
          </FormField>

          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch
              id="encaixe"
              checked={formulario.encaixe}
              onCheckedChange={(valor) => alterar('encaixe', valor)}
            />
            <Label htmlFor="encaixe">
              Encaixe (permite sobreposição, com aviso visual na agenda)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
