'use client';

import { useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Tema } from '@/modules/organization/domain/value-objects/tema.vo';
import type {
  TemaProps,
  NovoTemaPreset,
} from '@/modules/organization/domain/value-objects/tema.vo';
import { Button } from '@/client/ui/button';
import { Input } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';

type SalvarPresetHandler = (params: NovoTemaPreset) => void;
type NovoPresetFormProps = {
  tema: TemaProps;
  aoSalvar: SalvarPresetHandler;
  carregando: boolean;
  valoresIniciais?: NovoTemaPreset;
  presetId?: string;
  children?: ReactNode;
};

export function NovoPresetForm({
  tema,
  aoSalvar,
  carregando,
  valoresIniciais,
  presetId,
  children,
}: NovoPresetFormProps) {
  const schema = z
    .object({ nome: z.string(), descricao: z.string() })
    .superRefine((value, context) => {
      const base = Tema.create(tema);
      const result = base.isFailure
        ? base
        : presetId
          ? base.value.editarPreset({ id: presetId, ...value })
          : base.value.salvarComoPreset(value);
      if (result.isFailure)
        context.addIssue({
          code: 'custom',
          path: ['nome'],
          message: result.error.message,
        });
    });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NovoTemaPreset>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: valoresIniciais?.nome ?? '',
      descricao: valoresIniciais?.descricao ?? '',
    },
  });
  return (
    <form onSubmit={handleSubmit(aoSalvar)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Salve esta combinação de cores dos modos claro e escuro para reutilizar na rede.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="preset-nome">Nome do preset</Label>
        <Input
          id="preset-nome"
          {...register('nome')}
          disabled={carregando}
          aria-invalid={Boolean(errors.nome)}
          aria-describedby={errors.nome ? 'preset-nome-erro' : undefined}
          placeholder="Ex.: Cores da nossa clínica"
        />
        {errors.nome ? (
          <p id="preset-nome-erro" role="alert" className="text-sm text-destructive">
            {errors.nome.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="preset-descricao">Descrição (opcional)</Label>
        <Input id="preset-descricao" {...register('descricao')} disabled={carregando} />
      </div>
      {children}
      <Button type="submit" carregando={carregando}>
        <Save aria-hidden />
        {presetId ? 'Salvar alterações' : 'Salvar e aplicar preset'}
      </Button>
    </form>
  );
}
