'use client';

import * as React from 'react';
import { FileSignature, MessageSquarePlus, Stethoscope } from 'lucide-react';
import { Badge } from '@/client/ui/badge';
import { Button } from '@/client/ui/button';
import { EstadoVazio } from '@/client/ui/feedback';
import { Textarea } from '@/client/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Label } from '@/client/ui/controls';
import { formatarDataHora } from '@/client/lib/format';
import type { EvolucaoDto } from '@/client/services/prontuario.service';

export type EvolucoesTimelineProps = {
  evolucoes: EvolucaoDto[];
  /** Só permitido após a finalização; o atendimento em rascunho usa o formulário. */
  permitirAdendo?: boolean;
  enviando?: boolean;
  aoAdicionar?: (entrada: { conteudo: string; tipo: string }) => void;
};

const TIPOS_ADENDO = [
  { valor: 'adendo', rotulo: 'Adendo' },
  { valor: 'retificacao', rotulo: 'Retificação' },
  { valor: 'evolucao', rotulo: 'Evolução' },
];

/** Linha do tempo do prontuário: evoluções assinadas + adendos (§3.5/§3.6). */
export function EvolucoesTimeline({ evolucoes, permitirAdendo = false, enviando = false, aoAdicionar }: EvolucoesTimelineProps) {
  const [conteudo, setConteudo] = React.useState('');
  const [tipo, setTipo] = React.useState('adendo');

  return (
    <div className="space-y-4">
      {evolucoes.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum registro no prontuário"
          descricao="As evoluções aparecem aqui após o salvamento do rascunho ou a finalização do atendimento."
          icone={Stethoscope}
        />
      ) : (
        <ol className="relative space-y-4 border-l pl-5">
          {evolucoes.map((evolucao) => (
            <li key={evolucao.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[27px] top-1.5 flex size-3 items-center justify-center rounded-full border-2 border-background bg-primary"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={evolucao.tipo === 'adendo' ? 'warning' : 'secondary'}>{evolucao.tipoLabel}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatarDataHora(evolucao.assinadoEm)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm">{evolucao.conteudo}</p>
            </li>
          ))}
        </ol>
      )}

      {permitirAdendo && aoAdicionar ? (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <MessageSquarePlus className="size-4 text-muted-foreground" aria-hidden />
            Adicionar adendo
          </p>
          <p className="text-xs text-muted-foreground">
            O prontuário finalizado é imutável: correções e complementos entram sempre como adendo assinado.
          </p>

          <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="adendo-tipo" className="text-xs">
                Tipo
              </Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="adendo-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ADENDO.map((opcao) => (
                    <SelectItem key={opcao.valor} value={opcao.valor}>
                      {opcao.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adendo-conteudo" className="text-xs">
                Conteúdo *
              </Label>
              <Textarea
                id="adendo-conteudo"
                rows={3}
                value={conteudo}
                onChange={(evento) => setConteudo(evento.target.value)}
                placeholder="Descreva a correção ou o complemento com a maior precisão possível."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              carregando={enviando}
              disabled={conteudo.trim().length < 5}
              onClick={() => {
                aoAdicionar({ conteudo, tipo });
                setConteudo('');
              }}
            >
              <FileSignature aria-hidden />
              Assinar adendo
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
