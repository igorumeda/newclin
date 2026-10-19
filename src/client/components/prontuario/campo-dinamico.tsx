'use client';

import * as React from 'react';
import { Input, Textarea } from '@/client/ui/input';
import { Checkbox } from '@/client/ui/controls';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { cn } from '@/client/lib/utils';
import type { CampoEstrutura } from '@/modules/medical-record/domain/value-objects/campo-template.vo';
import type { ValorCampo } from '@/modules/medical-record/domain/value-objects/dados-prontuario.vo';

export type CampoDinamicoProps = {
  campo: CampoEstrutura;
  valor: ValorCampo | undefined;
  aoMudar: (valor: ValorCampo) => void;
  /** Mensagem de validação vinda do servidor (ou da finalização). */
  erro?: string;
  idPrefix: string;
};

/** Renderiza um campo do motor dinâmico de prontuário (§3.5) com acessibilidade. */
export function CampoDinamico({ campo, valor, aoMudar, erro, idPrefix }: CampoDinamicoProps) {
  const id = `${idPrefix}-${campo.id}`;
  const descricaoId = campo.ajuda ? `${id}-ajuda` : undefined;
  const erroId = erro ? `${id}-erro` : undefined;

  const propsComuns = {
    id,
    'aria-describedby': [descricaoId, erroId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': erro ? true : undefined,
    erro: Boolean(erro),
  } as const;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1">
        {campo.rotulo}
        {campo.obrigatorio ? <span className="text-destructive">*</span> : null}
      </Label>

      {(() => {
        switch (campo.tipo) {
          case 'texto_longo':
            return (
              <Textarea
                {...propsComuns}
                rows={4}
                placeholder={campo.placeholder ?? undefined}
                value={(valor as string) ?? ''}
                onChange={(evento) => aoMudar(evento.target.value)}
              />
            );

          case 'numero':
            return (
              <Input
                {...propsComuns}
                type="number"
                inputMode="decimal"
                min={campo.min}
                max={campo.max}
                placeholder={campo.placeholder ?? undefined}
                value={valor === null || valor === undefined ? '' : String(valor)}
                onChange={(evento) => aoMudar(evento.target.value === '' ? null : Number(evento.target.value))}
              />
            );

          case 'data':
            return (
              <Input
                {...propsComuns}
                type="date"
                value={(valor as string) ?? ''}
                onChange={(evento) => aoMudar(evento.target.value || null)}
              />
            );

          case 'selecao_unica':
            return (
              <Select value={(valor as string) ?? ''} onValueChange={(novo) => aoMudar(novo)}>
                <SelectTrigger {...propsComuns}>
                  <SelectValue placeholder={campo.placeholder ?? 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {(campo.opcoes ?? []).map((opcao) => (
                    <SelectItem key={opcao} value={opcao}>
                      {opcao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );

          case 'selecao_multipla': {
            const selecionadas = Array.isArray(valor) ? (valor as string[]) : [];
            return (
              <div className="flex flex-wrap gap-3" role="group" aria-describedby={propsComuns['aria-describedby']}>
                {(campo.opcoes ?? []).map((opcao, indice) => (
                  <label key={opcao} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selecionadas.includes(opcao)}
                      onCheckedChange={(marcado) =>
                        aoMudar(
                          marcado === true
                            ? [...selecionadas, opcao]
                            : selecionadas.filter((item) => item !== opcao),
                        )
                      }
                      aria-label={opcao}
                      id={indice === 0 ? id : undefined}
                    />
                    {opcao}
                  </label>
                ))}
              </div>
            );
          }

          case 'escala': {
            const min = campo.min ?? 0;
            const max = campo.max ?? 10;
            const opcoes = Array.from({ length: max - min + 1 }, (_, indice) => min + indice);
            return (
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={campo.rotulo}>
                {opcoes.map((numero) => (
                  <button
                    key={numero}
                    type="button"
                    role="radio"
                    aria-checked={valor === numero}
                    onClick={() => aoMudar(numero)}
                    className={cn(
                      'size-9 rounded-md border text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      valor === numero
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-accent',
                    )}
                  >
                    {numero}
                  </button>
                ))}
              </div>
            );
          }

          case 'sim_nao':
            return (
              <div className="flex gap-2" role="radiogroup" aria-label={campo.rotulo}>
                {[
                  { rotulo: 'Sim', valor: true },
                  { rotulo: 'Não', valor: false },
                ].map((opcao) => (
                  <button
                    key={opcao.rotulo}
                    type="button"
                    role="radio"
                    aria-checked={valor === opcao.valor}
                    onClick={() => aoMudar(opcao.valor)}
                    className={cn(
                      'rounded-md border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      valor === opcao.valor
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-accent',
                    )}
                  >
                    {opcao.rotulo}
                  </button>
                ))}
              </div>
            );

          case 'anexo':
            return (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Os anexos são adicionados na aba <strong>Anexos</strong> do paciente — eles ficam vinculados a
                este atendimento.
              </p>
            );

          default:
            return (
              <Input
                {...propsComuns}
                type="text"
                maxLength={500}
                placeholder={campo.placeholder ?? undefined}
                value={(valor as string) ?? ''}
                onChange={(evento) => aoMudar(evento.target.value)}
              />
            );
        }
      })()}

      {campo.ajuda ? (
        <p id={descricaoId} className="text-xs text-muted-foreground">
          {campo.ajuda}
        </p>
      ) : null}

      {erro ? (
        <p id={erroId} role="alert" className="text-xs font-medium text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
