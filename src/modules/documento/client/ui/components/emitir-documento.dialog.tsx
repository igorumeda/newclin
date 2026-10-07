'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/client/ui/forms/form-field.component';
import {
  ROTULO_TIPO_DOCUMENTO,
  TIPOS_DOCUMENTO,
} from '../../../domain/value-objects/tipo-documento.vo';
import type { TipoDocumentoValue } from '../../../domain/value-objects/tipo-documento.vo';
import type { ConteudoDocumento } from '../../../domain/entities/documento.entity';
import { documentoApiService } from '../../services/documento-api.service';

export type EmitirDocumentoDialogProps = {
  aberto: boolean;
  unidadeId: string;
  pacienteId: string;
  atendimentoId: string;
  profissionalId: string;
  aoFechar: () => void;
};

type FormularioDocumento = {
  tipo: TipoDocumentoValue;
  medicamentos: string;
  orientacoes: string;
  diasAfastamento: string;
  cid10: string;
  exames: string;
  indicacaoClinica: string;
  horaChegada: string;
  horaSaida: string;
};

const FORMULARIO_VAZIO: FormularioDocumento = {
  tipo: 'receita',
  medicamentos: '',
  orientacoes: '',
  diasAfastamento: '1',
  cid10: '',
  exames: '',
  indicacaoClinica: '',
  horaChegada: '08:00',
  horaSaida: '09:00',
};

function montarConteudo(formulario: FormularioDocumento): ConteudoDocumento {
  const linhas = (valor: string): string[] =>
    valor
      .split('\n')
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0);

  switch (formulario.tipo) {
    case 'receita':
      return {
        medicamentos: linhas(formulario.medicamentos),
        orientacoes: formulario.orientacoes,
      };
    case 'atestado':
      return { diasAfastamento: Number(formulario.diasAfastamento), cid10: formulario.cid10 };
    case 'solicitacao_exames':
      return { exames: linhas(formulario.exames), indicacaoClinica: formulario.indicacaoClinica };
    default:
      return { horaChegada: formulario.horaChegada, horaSaida: formulario.horaSaida };
  }
}

export function EmitirDocumentoDialog({
  aberto,
  unidadeId,
  pacienteId,
  atendimentoId,
  profissionalId,
  aoFechar,
}: EmitirDocumentoDialogProps) {
  const queryClient = useQueryClient();
  const [formulario, setFormulario] = useState<FormularioDocumento>(FORMULARIO_VAZIO);

  const documentos = useQuery({
    queryKey: ['documentos', 'atendimento', atendimentoId],
    queryFn: () => documentoApiService.listar({ atendimentoId }),
    enabled: aberto,
  });

  const emitir = useMutation({
    mutationFn: async () => {
      const criado = await documentoApiService.criar({
        unidadeId,
        pacienteId,
        atendimentoId,
        profissionalId,
        tipo: formulario.tipo,
        conteudo: montarConteudo(formulario),
      });
      return documentoApiService.emitir({ id: criado.id });
    },
    onSuccess: (documento) => {
      toast.success('Documento emitido em PDF');
      void queryClient.invalidateQueries({ queryKey: ['documentos'] });
      if (documento.pdfUrl) window.open(documento.pdfUrl, '_blank', 'noopener');
      setFormulario(FORMULARIO_VAZIO);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  function alterar(campo: keyof FormularioDocumento, valor: string): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <Dialog open={aberto} onOpenChange={(estado) => (!estado ? aoFechar() : undefined)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Emitir documento clínico</DialogTitle>
          <DialogDescription>
            O PDF usa o cabeçalho da rede e torna-se imutável após a emissão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField rotulo="Tipo de documento" obrigatorio>
            <Select
              value={formulario.tipo}
              onValueChange={(valor) => alterar('tipo', valor as TipoDocumentoValue)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {ROTULO_TIPO_DOCUMENTO[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {formulario.tipo === 'receita' ? (
            <>
              <FormField rotulo="Medicamentos" ajuda="Um por linha" obrigatorio>
                <Textarea
                  value={formulario.medicamentos}
                  rows={5}
                  placeholder={'Dipirona 500mg — 1 comprimido de 6/6h por 3 dias'}
                  onChange={(evento) => alterar('medicamentos', evento.target.value)}
                />
              </FormField>
              <FormField rotulo="Orientações">
                <Textarea
                  value={formulario.orientacoes}
                  onChange={(evento) => alterar('orientacoes', evento.target.value)}
                />
              </FormField>
            </>
          ) : null}

          {formulario.tipo === 'atestado' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField rotulo="Dias de afastamento" obrigatorio>
                <Input
                  type="number"
                  min={1}
                  value={formulario.diasAfastamento}
                  onChange={(evento) => alterar('diasAfastamento', evento.target.value)}
                />
              </FormField>
              <FormField rotulo="CID-10">
                <Input
                  value={formulario.cid10}
                  onChange={(evento) => alterar('cid10', evento.target.value)}
                />
              </FormField>
            </div>
          ) : null}

          {formulario.tipo === 'solicitacao_exames' ? (
            <>
              <FormField rotulo="Exames" ajuda="Um por linha" obrigatorio>
                <Textarea
                  value={formulario.exames}
                  rows={5}
                  onChange={(evento) => alterar('exames', evento.target.value)}
                />
              </FormField>
              <FormField rotulo="Indicação clínica">
                <Input
                  value={formulario.indicacaoClinica}
                  onChange={(evento) => alterar('indicacaoClinica', evento.target.value)}
                />
              </FormField>
            </>
          ) : null}

          {formulario.tipo === 'declaracao_comparecimento' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField rotulo="Hora de chegada" obrigatorio>
                <Input
                  type="time"
                  value={formulario.horaChegada}
                  onChange={(evento) => alterar('horaChegada', evento.target.value)}
                />
              </FormField>
              <FormField rotulo="Hora de saída" obrigatorio>
                <Input
                  type="time"
                  value={formulario.horaSaida}
                  onChange={(evento) => alterar('horaSaida', evento.target.value)}
                />
              </FormField>
            </div>
          ) : null}

          {(documentos.data?.length ?? 0) > 0 ? (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Documentos deste atendimento</p>
              <ul className="space-y-1 text-sm">
                {documentos.data?.map((documento) => (
                  <li key={documento.id} className="flex items-center justify-between gap-3">
                    <span>{documento.tipoRotulo}</span>
                    <Badge variant={documento.status === 'emitido' ? 'success' : 'secondary'}>
                      {documento.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Fechar
          </Button>
          <Button onClick={() => emitir.mutate()} disabled={emitir.isPending}>
            <FileSignature className="h-4 w-4" aria-hidden />
            Emitir PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
