'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormActions } from '@/client/ui/forms/form-actions.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { Cpf } from '../../../domain/value-objects/cpf.vo';
import { DataNascimento } from '../../../domain/value-objects/data-nascimento.vo';
import type { PacienteResponseDto } from '../../dtos/paciente.response.dto';
import { pacienteApiService } from '../../services/paciente-api.service';

export type PacienteFormProps = { paciente?: PacienteResponseDto };

export type ErrosPaciente = Partial<Record<'nome' | 'cpf' | 'dataNascimento', string>>;
export type ValidarPacienteParams = { nome: string; cpf: string; dataNascimento: string };
export type ResultadoValidacaoPaciente = { valido: boolean; erros: ErrosPaciente };

type FormularioPaciente = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  responsavelNome: string;
  responsavelTelefone: string;
  alergias: string;
  condicoesCronicas: string;
  observacoes: string;
  consentimentoLgpd: boolean;
};

/** Validação no cliente com os mesmos Value Objects do domínio. */
export function validarFormularioPaciente(
  dados: ValidarPacienteParams,
): ResultadoValidacaoPaciente {
  const erros: ErrosPaciente = {};
  if (!dados.nome || dados.nome.trim().length < 3) {
    erros.nome = 'Informe o nome completo do paciente';
  }
  const cpf = Cpf.create(dados.cpf);
  if (cpf.isFailure) erros.cpf = cpf.error.message;
  const nascimento = DataNascimento.create(dados.dataNascimento);
  if (nascimento.isFailure) erros.dataNascimento = nascimento.error.message;
  return { valido: Object.keys(erros).length === 0, erros };
}

function formularioInicial(paciente?: PacienteResponseDto): FormularioPaciente {
  return {
    nome: paciente?.nome ?? '',
    cpf: paciente?.cpfFormatado ?? '',
    dataNascimento: paciente?.dataNascimento?.slice(0, 10) ?? '',
    sexo: paciente?.sexo ?? 'nao_informado',
    telefone: paciente?.telefone ?? '',
    email: paciente?.email ?? '',
    logradouro: paciente?.endereco?.logradouro ?? '',
    numero: paciente?.endereco?.numero ?? '',
    bairro: paciente?.endereco?.bairro ?? '',
    cidade: paciente?.endereco?.cidade ?? '',
    uf: paciente?.endereco?.uf ?? '',
    cep: paciente?.endereco?.cep ?? '',
    responsavelNome: paciente?.responsavelNome ?? '',
    responsavelTelefone: paciente?.responsavelTelefone ?? '',
    alergias: (paciente?.alergias ?? []).join(', '),
    condicoesCronicas: (paciente?.condicoesCronicas ?? []).join(', '),
    observacoes: paciente?.observacoes ?? '',
    consentimentoLgpd: paciente?.consentimentoLgpd ?? false,
  };
}

function listaDeTexto(valor: string): string[] {
  return valor
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function PacienteForm({ paciente }: PacienteFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formulario, setFormulario] = useState<FormularioPaciente>(formularioInicial(paciente));
  const [erros, setErros] = useState<ErrosPaciente>({});

  const salvar = useMutation({
    mutationFn: async () => {
      const dados = {
        nome: formulario.nome,
        cpf: formulario.cpf,
        dataNascimento: formulario.dataNascimento,
        sexo: formulario.sexo,
        telefone: formulario.telefone || null,
        email: formulario.email || null,
        endereco: {
          logradouro: formulario.logradouro,
          numero: formulario.numero,
          bairro: formulario.bairro,
          cidade: formulario.cidade,
          uf: formulario.uf,
          cep: formulario.cep,
          complemento: '',
        },
        responsavelNome: formulario.responsavelNome || null,
        responsavelTelefone: formulario.responsavelTelefone || null,
        alergias: listaDeTexto(formulario.alergias),
        condicoesCronicas: listaDeTexto(formulario.condicoesCronicas),
        observacoes: formulario.observacoes || null,
        consentimentoLgpd: formulario.consentimentoLgpd,
      };

      return paciente
        ? pacienteApiService.atualizar({ id: paciente.id, dados })
        : pacienteApiService.criar(dados);
    },
    onSuccess: (salvo) => {
      toast.success(paciente ? 'Paciente atualizado' : 'Paciente cadastrado');
      void queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      router.push(`/pacientes/${salvo.id}`);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  function alterar(campo: keyof FormularioPaciente, valor: string | boolean): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const validacao = validarFormularioPaciente({
      nome: formulario.nome,
      cpf: formulario.cpf,
      dataNascimento: formulario.dataNascimento,
    });
    setErros(validacao.erros);
    if (!validacao.valido) {
      toast.error('Revise os campos destacados');
      return;
    }
    salvar.mutate();
  }

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField rotulo="Nome completo" erro={erros.nome} obrigatorio className="sm:col-span-2">
            <Input
              value={formulario.nome}
              onChange={(evento) => alterar('nome', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="CPF" erro={erros.cpf} obrigatorio>
            <Input
              value={formulario.cpf}
              onChange={(evento) => alterar('cpf', evento.target.value)}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </FormField>
          <FormField rotulo="Data de nascimento" erro={erros.dataNascimento} obrigatorio>
            <Input
              type="date"
              value={formulario.dataNascimento}
              onChange={(evento) => alterar('dataNascimento', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Sexo">
            <Select value={formulario.sexo} onValueChange={(valor) => alterar('sexo', valor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
                <SelectItem value="nao_informado">Não informado</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato e endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField rotulo="Telefone">
            <Input
              value={formulario.telefone}
              onChange={(evento) => alterar('telefone', evento.target.value)}
              placeholder="(11) 99999-9999"
            />
          </FormField>
          <FormField rotulo="E-mail">
            <Input
              type="email"
              value={formulario.email}
              onChange={(evento) => alterar('email', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Logradouro">
            <Input
              value={formulario.logradouro}
              onChange={(evento) => alterar('logradouro', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Número">
            <Input
              value={formulario.numero}
              onChange={(evento) => alterar('numero', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Bairro">
            <Input
              value={formulario.bairro}
              onChange={(evento) => alterar('bairro', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Cidade">
            <Input
              value={formulario.cidade}
              onChange={(evento) => alterar('cidade', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="UF">
            <Input
              value={formulario.uf}
              maxLength={2}
              onChange={(evento) => alterar('uf', evento.target.value.toUpperCase())}
            />
          </FormField>
          <FormField rotulo="CEP">
            <Input
              value={formulario.cep}
              onChange={(evento) => alterar('cep', evento.target.value)}
              placeholder="00000-000"
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados clínicos e responsável</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField rotulo="Responsável (menores de idade)">
            <Input
              value={formulario.responsavelNome}
              onChange={(evento) => alterar('responsavelNome', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Telefone do responsável">
            <Input
              value={formulario.responsavelTelefone}
              onChange={(evento) => alterar('responsavelTelefone', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Alergias" ajuda="Separe por vírgula">
            <Input
              value={formulario.alergias}
              onChange={(evento) => alterar('alergias', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Condições crônicas" ajuda="Separe por vírgula">
            <Input
              value={formulario.condicoesCronicas}
              onChange={(evento) => alterar('condicoesCronicas', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Observações" className="sm:col-span-2">
            <Textarea
              value={formulario.observacoes}
              onChange={(evento) => alterar('observacoes', evento.target.value)}
            />
          </FormField>

          <div className="flex items-start gap-3 sm:col-span-2">
            <Checkbox
              id="consentimento"
              checked={formulario.consentimentoLgpd}
              onCheckedChange={(valor) => alterar('consentimentoLgpd', valor === true)}
            />
            <Label htmlFor="consentimento" className="leading-snug">
              O paciente autorizou o tratamento dos seus dados pessoais e de saúde (LGPD).
            </Label>
          </div>
        </CardContent>
      </Card>

      <FormActions>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvar.isPending}>
          {paciente ? 'Salvar alterações' : 'Cadastrar paciente'}
        </Button>
      </FormActions>
    </form>
  );
}
