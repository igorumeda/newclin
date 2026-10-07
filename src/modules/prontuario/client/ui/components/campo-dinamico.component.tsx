'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/client/ui/forms/form-field.component';
import { ESCALA_MAXIMA, ESCALA_MINIMA } from '../../../domain/value-objects/tipo-campo.vo';
import type { CampoTemplate } from '../../../domain/value-objects/estrutura-template.vo';
import type { ValorCampo } from '../../../domain/entities/atendimento.entity';

export type CampoDinamicoProps = {
  campo: CampoTemplate;
  valor: ValorCampo;
  somenteLeitura: boolean;
  aoAlterar: (valor: ValorCampo) => void;
};

/** Renderiza um campo do template conforme seu tipo (motor dinâmico, spec §3.5). */
export function CampoDinamico({ campo, valor, somenteLeitura, aoAlterar }: CampoDinamicoProps) {
  if (campo.tipo === 'texto_longo') {
    return (
      <FormField rotulo={campo.rotulo} ajuda={campo.ajuda ?? undefined} obrigatorio={campo.obrigatorio} className="sm:col-span-2">
        <Textarea
          value={typeof valor === 'string' ? valor : ''}
          disabled={somenteLeitura}
          onChange={(evento) => aoAlterar(evento.target.value)}
        />
      </FormField>
    );
  }

  if (campo.tipo === 'numero' || campo.tipo === 'escala') {
    const escala = campo.tipo === 'escala';
    return (
      <FormField
        rotulo={campo.rotulo}
        ajuda={campo.ajuda ?? (escala ? `De ${ESCALA_MINIMA} a ${ESCALA_MAXIMA}` : undefined)}
        obrigatorio={campo.obrigatorio}
      >
        <Input
          type="number"
          min={escala ? ESCALA_MINIMA : undefined}
          max={escala ? ESCALA_MAXIMA : undefined}
          value={typeof valor === 'number' || typeof valor === 'string' ? String(valor) : ''}
          disabled={somenteLeitura}
          onChange={(evento) =>
            aoAlterar(evento.target.value === '' ? null : Number(evento.target.value))
          }
        />
      </FormField>
    );
  }

  if (campo.tipo === 'data') {
    return (
      <FormField rotulo={campo.rotulo} ajuda={campo.ajuda ?? undefined} obrigatorio={campo.obrigatorio}>
        <Input
          type="date"
          value={typeof valor === 'string' ? valor : ''}
          disabled={somenteLeitura}
          onChange={(evento) => aoAlterar(evento.target.value)}
        />
      </FormField>
    );
  }

  if (campo.tipo === 'sim_nao') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <Label className="leading-snug">{campo.rotulo}</Label>
        <Switch
          checked={valor === true}
          disabled={somenteLeitura}
          onCheckedChange={(marcado) => aoAlterar(marcado)}
        />
      </div>
    );
  }

  if (campo.tipo === 'selecao_unica') {
    return (
      <FormField rotulo={campo.rotulo} ajuda={campo.ajuda ?? undefined} obrigatorio={campo.obrigatorio}>
        <Select
          value={typeof valor === 'string' ? valor : ''}
          disabled={somenteLeitura}
          onValueChange={(selecionado) => aoAlterar(selecionado)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {campo.opcoes.map((opcao) => (
              <SelectItem key={opcao} value={opcao}>
                {opcao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    );
  }

  if (campo.tipo === 'selecao_multipla') {
    const selecionados = Array.isArray(valor) ? valor : [];
    return (
      <div className="space-y-2 sm:col-span-2">
        <Label>{campo.rotulo}</Label>
        <div className="flex flex-wrap gap-4 rounded-md border p-3">
          {campo.opcoes.map((opcao) => (
            <label key={opcao} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selecionados.includes(opcao)}
                disabled={somenteLeitura}
                onCheckedChange={(marcado) =>
                  aoAlterar(
                    marcado === true
                      ? [...selecionados, opcao]
                      : selecionados.filter((item) => item !== opcao),
                  )
                }
              />
              {opcao}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (campo.tipo === 'anexo') {
    return (
      <FormField
        rotulo={campo.rotulo}
        ajuda={campo.ajuda ?? 'Informe a referência do anexo enviado (PDF, JPG ou PNG até 10 MB)'}
        obrigatorio={campo.obrigatorio}
      >
        <Input
          value={typeof valor === 'string' ? valor : ''}
          disabled={somenteLeitura}
          placeholder="Nome ou identificação do anexo"
          onChange={(evento) => aoAlterar(evento.target.value)}
        />
      </FormField>
    );
  }

  return (
    <FormField rotulo={campo.rotulo} ajuda={campo.ajuda ?? undefined} obrigatorio={campo.obrigatorio}>
      <Input
        value={typeof valor === 'string' ? valor : ''}
        disabled={somenteLeitura}
        onChange={(evento) => aoAlterar(evento.target.value)}
      />
    </FormField>
  );
}
