'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/client/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/client/ui/form';
import { Input, Textarea } from '@/client/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Checkbox, Label } from '@/client/ui/controls';
import { Alert, AlertDescription, AlertTitle } from '@/client/ui/feedback';
import { Separator } from '@/client/ui/feedback';
import { pacienteService, type PacienteDto } from '@/client/services/paciente.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { formatCpf, maskCpf, maskPhone, stripCpf } from '@/client/lib/utils';
import { formatarData } from '@/client/lib/format';
import type { PacienteDuplicadoDetalhe } from '@/modules/patient/domain/errors/paciente.errors';

const SEXOS = [
  { valor: 'feminino', rotulo: 'Feminino' },
  { valor: 'masculino', rotulo: 'Masculino' },
  { valor: 'outro', rotulo: 'Outro' },
  { valor: 'nao_informado', rotulo: 'Não informado' },
];

function idadeEm(dataNascimento: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) return null;
  const nascimento = new Date(`${dataNascimento}T00:00:00Z`);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear();
  const mes = hoje.getUTCMonth() - nascimento.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoje.getUTCDate() < nascimento.getUTCDate())) idade -= 1;
  return idade;
}

const esquema = z
  .object({
    nome: z.string().trim().min(3, 'Informe o nome completo').max(150),
    cpf: z.string().trim().min(11, 'CPF incompleto').max(14),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de nascimento'),
    sexo: z.enum(['feminino', 'masculino', 'outro', 'nao_informado']),
    telefone: z.string().trim().max(20).optional().or(z.literal('')),
    email: z.string().trim().max(150).email('E-mail inválido').optional().or(z.literal('')),
    cep: z.string().trim().max(9).optional().or(z.literal('')),
    logradouro: z.string().trim().max(150).optional().or(z.literal('')),
    numero: z.string().trim().max(20).optional().or(z.literal('')),
    complemento: z.string().trim().max(80).optional().or(z.literal('')),
    bairro: z.string().trim().max(80).optional().or(z.literal('')),
    cidade: z.string().trim().max(80).optional().or(z.literal('')),
    uf: z.string().trim().max(2).optional().or(z.literal('')),
    responsavelNome: z.string().trim().max(150).optional().or(z.literal('')),
    responsavelCpf: z.string().trim().max(14).optional().or(z.literal('')),
    responsavelTelefone: z.string().trim().max(20).optional().or(z.literal('')),
    responsavelParentesco: z.string().trim().max(20).optional().or(z.literal('')),
    alergias: z.string().trim().max(2000).optional().or(z.literal('')),
    condicoesCronicas: z.string().trim().max(2000).optional().or(z.literal('')),
    observacoes: z.string().trim().max(2000).optional().or(z.literal('')),
    consentimentoLgpd: z.boolean().default(false),
  })
  .superRefine((dados, contexto) => {
    const idade = idadeEm(dados.dataNascimento);
    // §3.3 — paciente menor de idade exige responsável legal.
    if (idade !== null && idade < 18 && !dados.responsavelNome) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['responsavelNome'],
        message: 'Paciente menor de idade exige nome do responsável legal',
      });
    }
  });

type FormularioPacienteValores = z.infer<typeof esquema>;

export type FormularioPacienteProps = {
  /** Paciente em edição; ausente = novo cadastro. */
  paciente?: PacienteDto | null;
  aoSalvar?: (paciente: PacienteDto) => void;
  aoCancelar?: () => void;
  /** Rota de retorno após criar (usada na página dedicada). */
  textoBotao?: string;
};

export function FormularioPaciente({
  paciente,
  aoSalvar,
  aoCancelar,
  textoBotao = 'Salvar paciente',
}: FormularioPacienteProps) {
  const queryClient = useQueryClient();
  const { ehAdmin } = usePermissoes();
  const [duplicados, setDuplicados] = React.useState<PacienteDuplicadoDetalhe[]>([]);
  const [ignorarDuplicidade, setIgnorarDuplicidade] = React.useState(false);

  const form = useForm<FormularioPacienteValores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nome: paciente?.nome ?? '',
      cpf: paciente?.cpfFormatado ?? '',
      dataNascimento: paciente?.dataNascimento ?? '',
      sexo: (paciente?.sexo as FormularioPacienteValores['sexo']) ?? 'nao_informado',
      telefone: paciente?.telefone ?? '',
      email: paciente?.email ?? '',
      cep: paciente?.endereco.cep ?? '',
      logradouro: paciente?.endereco.logradouro ?? '',
      numero: paciente?.endereco.numero ?? '',
      complemento: paciente?.endereco.complemento ?? '',
      bairro: paciente?.endereco.bairro ?? '',
      cidade: paciente?.endereco.cidade ?? '',
      uf: paciente?.endereco.uf ?? '',
      responsavelNome: paciente?.responsavel.nome ?? '',
      responsavelCpf: '',
      responsavelTelefone: paciente?.responsavel.telefone ?? '',
      responsavelParentesco: paciente?.responsavel.parentesco ?? '',
      alergias: paciente?.alergias ?? '',
      condicoesCronicas: paciente?.condicoesCronicas ?? '',
      observacoes: paciente?.observacoes ?? '',
      consentimentoLgpd: paciente?.consentimentoLgpd.concedido ?? false,
    },
  });

  const salvar = useMutation({
    mutationFn: async (valores: FormularioPacienteValores) => {
      const payload = {
        nome: valores.nome,
        cpf: stripCpf(valores.cpf),
        dataNascimento: valores.dataNascimento,
        sexo: valores.sexo,
        telefone: valores.telefone || null,
        email: valores.email || null,
        endereco: {
          cep: valores.cep || null,
          logradouro: valores.logradouro || null,
          numero: valores.numero || null,
          complemento: valores.complemento || null,
          bairro: valores.bairro || null,
          cidade: valores.cidade || null,
          uf: valores.uf ? valores.uf.toUpperCase() : null,
        },
        responsavelNome: valores.responsavelNome || null,
        responsavelCpf: valores.responsavelCpf ? stripCpf(valores.responsavelCpf) : null,
        responsavelTelefone: valores.responsavelTelefone || null,
        responsavelParentesco: valores.responsavelParentesco || null,
        alergias: valores.alergias || null,
        condicoesCronicas: valores.condicoesCronicas || null,
        observacoes: valores.observacoes || null,
        consentimentoLgpd: valores.consentimentoLgpd,
        ignorarDuplicidade: ignorarDuplicidade || undefined,
      };

      return paciente
        ? pacienteService.atualizar(paciente.id, payload)
        : pacienteService.criar(payload);
    },
    onSuccess: (resultado) => {
      toast.success(paciente ? 'Paciente atualizado' : 'Paciente cadastrado');
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setDuplicados([]);
      aoSalvar?.(resultado);
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  /** Verificação de duplicidade antes de gravar (§3.3). */
  const verificarDuplicidade = useMutation({
    mutationFn: async (valores: FormularioPacienteValores) =>
      pacienteService.verificarDuplicidade({
        cpf: stripCpf(valores.cpf),
        nome: valores.nome,
        dataNascimento: valores.dataNascimento,
        ignorarId: paciente?.id ?? null,
      }),
    onSuccess: (resultado, valores) => {
      if (resultado.duplicados.length > 0 && !ignorarDuplicidade) {
        setDuplicados(resultado.duplicados);
        return;
      }
      salvar.mutate(valores);
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  async function aoEnviar(valores: FormularioPacienteValores) {
    if (!paciente) {
      verificarDuplicidade.mutate(valores);
      return;
    }
    salvar.mutate(valores);
  }

  const menorDeIdade = (idadeEm(form.watch('dataNascimento')) ?? 99) < 18;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(aoEnviar)} className="space-y-6" noValidate>
        {duplicados.length > 0 ? (
          <Alert variant="warning">
            <AlertTitle>Paciente possivelmente duplicado</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 space-y-1">
                {duplicados.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium">{item.nome}</span> · {formatCpf(item.cpf)} ·{' '}
                    {formatarData(item.dataNascimento)} —{' '}
                    <span className="text-xs">
                      {item.motivo === 'cpf' ? 'mesmo CPF' : 'mesmo nome e data de nascimento'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDuplicados([])}>
                  Revisar dados
                </Button>
                {ehAdmin ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setIgnorarDuplicidade(true);
                      salvar.mutate(form.getValues());
                    }}
                  >
                    Cadastrar mesmo assim
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-xs">
                O cadastro é bloqueado enquanto houver duplicidade confirmada. Em caso de homônimos,
                peça revisão ao administrador da rede.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Dados obrigatórios
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Maria da Silva" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={field.value}
                      onChange={(evento) => field.onChange(maskCpf(evento.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>Usado na detecção de duplicidade.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de nascimento *</FormLabel>
                  <FormControl>
                    <Input type="date" max={new Date().toISOString().slice(0, 10)} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sexo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEXOS.map((opcao) => (
                        <SelectItem key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="tel"
                      placeholder="(11) 99999-0000"
                      value={field.value ?? ''}
                      onChange={(evento) => field.onChange(maskPhone(evento.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="paciente@email.com" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <Separator />

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Endereço</legend>
          <div className="grid gap-4 sm:grid-cols-6">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem className="sm:col-span-4">
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, avenida…" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem className="sm:col-span-4">
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="uf"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>UF</FormLabel>
                  <FormControl>
                    <Input maxLength={2} className="uppercase" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <Separator />

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Responsável legal {menorDeIdade ? '*' : '(opcional)'}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="responsavelNome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do responsável</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsavelParentesco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parentesco</FormLabel>
                  <FormControl>
                    <Input placeholder="mãe, pai, tutor…" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsavelCpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do responsável</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      value={field.value ?? ''}
                      onChange={(evento) => field.onChange(maskCpf(evento.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsavelTelefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do responsável</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="tel"
                      value={field.value ?? ''}
                      onChange={(evento) => field.onChange(maskPhone(evento.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <Separator />

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Informações clínicas e LGPD
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="alergias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alergias</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Ex.: dipirona, penicilina" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="condicoesCronicas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condições crônicas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Ex.: hipertensão, diabetes" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Observações administrativas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>Não use este campo para informações clínicas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="consentimentoLgpd"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(valor) => field.onChange(valor === true)} />
                </FormControl>
                <div className="space-y-1">
                  <Label className="cursor-pointer" onClick={() => field.onChange(!field.value)}>
                    Consentimento LGPD registrado
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    O paciente (ou responsável) autorizou o tratamento dos dados pessoais para
                    finalidades clínicas e administrativas.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          {aoCancelar ? (
            <Button type="button" variant="outline" onClick={aoCancelar}>
              Cancelar
            </Button>
          ) : null}
          <Button
            type="submit"
            carregando={salvar.isPending || verificarDuplicidade.isPending}
            disabled={salvar.isPending || verificarDuplicidade.isPending}
          >
            {duplicados.length > 0 ? <Search aria-hidden /> : <Save aria-hidden />}
            {textoBotao}
          </Button>
        </div>

        {form.formState.isSubmitSuccessful && duplicados.length > 0 ? (
          <p className="flex items-center gap-2 text-xs text-warning">
            <AlertTriangle className="size-3.5" aria-hidden />
            Cadastro não realizado: confirme se é um paciente diferente.
          </p>
        ) : null}
      </form>
    </Form>
  );
}
