'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { DataTable } from '@/client/ui/data-display/data-table.component';
import type { ColunaTabela } from '@/client/ui/data-display/data-table.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { useAutenticacao } from '@/client/providers/auth-provider';
import { profissionalApiService } from '@/modules/profissional/client/services/profissional-api.service';
import { unidadeApiService } from '@/modules/unidade/client/services/unidade-api.service';
import { PAPEIS, ROTULO_PAPEL } from '../../../domain/value-objects/papel.vo';
import type { UsuarioResponseDto } from '../../dtos/usuario.response.dto';
import { authApiService } from '../../services/auth-api.service';

type FormularioUsuario = {
  nome: string;
  email: string;
  senha: string;
  role: string;
  unidadeId: string;
  profissionalId: string;
};

const SEM_VINCULO = '__nenhum__';

const FORMULARIO_VAZIO: FormularioUsuario = {
  nome: '',
  email: '',
  senha: '',
  role: 'recepcao',
  unidadeId: '',
  profissionalId: SEM_VINCULO,
};

export function UsuariosPage() {
  const queryClient = useQueryClient();
  const { pode } = useAutenticacao();
  const [aberto, setAberto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioUsuario>(FORMULARIO_VAZIO);

  const usuarios = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => authApiService.listarUsuarios({ incluirInativos: true }),
  });
  const unidades = useQuery({
    queryKey: ['unidades', 'ativas'],
    queryFn: () => unidadeApiService.listar({ apenasAtivas: true }),
  });
  const profissionais = useQuery({
    queryKey: ['profissionais', 'ativos'],
    queryFn: () => profissionalApiService.listar({ apenasAtivos: true }),
  });

  const criar = useMutation({
    mutationFn: () =>
      authApiService.criarUsuario({
        nome: formulario.nome,
        email: formulario.email,
        senha: formulario.senha,
        role: formulario.role,
        unidadesAcesso: formulario.unidadeId ? [formulario.unidadeId] : [],
        profissionalId:
          formulario.profissionalId === SEM_VINCULO ? null : formulario.profissionalId,
      }),
    onSuccess: () => {
      toast.success('Usuário criado');
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setFormulario(FORMULARIO_VAZIO);
      setAberto(false);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const desativar = useMutation({
    mutationFn: (usuario: UsuarioResponseDto) =>
      authApiService.desativarUsuario({ id: usuario.id }),
    onSuccess: () => {
      toast.success('Status atualizado');
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const colunas: ColunaTabela<UsuarioResponseDto>[] = [
    {
      chave: 'nome',
      titulo: 'Usuário',
      render: (usuario) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{usuario.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{usuario.email}</p>
        </div>
      ),
    },
    {
      chave: 'papel',
      titulo: 'Papel',
      render: (usuario) => <Badge variant="secondary">{usuario.rotuloRole}</Badge>,
    },
    {
      chave: 'unidades',
      titulo: 'Unidades',
      className: 'hidden md:table-cell',
      render: (usuario) => (
        <span className="text-sm text-muted-foreground">
          {usuario.unidadesAcesso.length} unidade(s)
        </span>
      ),
    },
    {
      chave: 'status',
      titulo: 'Situação',
      render: (usuario) => (
        <div className="flex items-center gap-2">
          <Badge variant={usuario.ativo ? 'success' : 'outline'}>
            {usuario.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
          {pode('usuario:escrever') && usuario.ativo ? (
            <Button size="sm" variant="outline" onClick={() => desativar.mutate(usuario)}>
              Desativar
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  function alterar(campo: keyof FormularioUsuario, valor: string): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <PageContainer>
      <PageTitle
        titulo="Usuários"
        descricao="Controle de acesso por papel: admin da rede, gestor, profissional e recepção."
        acoes={
          pode('usuario:escrever') ? (
            <Button onClick={() => setAberto(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Novo usuário
            </Button>
          ) : null
        }
      />

      <DataTable
        colunas={colunas}
        itens={usuarios.data ?? []}
        chaveDoItem={(usuario) => usuario.id}
        carregando={usuarios.isLoading}
        mensagemVazia="Nenhum usuário cadastrado"
      />

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              A senha deve ter no mínimo 8 caracteres, com letras e números.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <FormField rotulo="Nome" obrigatorio>
              <Input value={formulario.nome} onChange={(e) => alterar('nome', e.target.value)} />
            </FormField>
            <FormField rotulo="E-mail" obrigatorio>
              <Input
                type="email"
                value={formulario.email}
                onChange={(e) => alterar('email', e.target.value)}
              />
            </FormField>
            <FormField rotulo="Senha provisória" obrigatorio>
              <Input
                type="password"
                value={formulario.senha}
                onChange={(e) => alterar('senha', e.target.value)}
              />
            </FormField>
            <FormField rotulo="Papel" obrigatorio>
              <Select value={formulario.role} onValueChange={(valor) => alterar('role', valor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAPEIS.map((papel) => (
                    <SelectItem key={papel} value={papel}>
                      {ROTULO_PAPEL[papel]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField rotulo="Unidade de acesso">
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
            {formulario.role === 'profissional' ? (
              <FormField rotulo="Profissional vinculado" obrigatorio>
                <Select
                  value={formulario.profissionalId}
                  onValueChange={(valor) => alterar('profissionalId', valor)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_VINCULO}>Sem vínculo</SelectItem>
                    {profissionais.data?.map((profissional) => (
                      <SelectItem key={profissional.id} value={profissional.id}>
                        {profissional.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
              <UserCog className="h-4 w-4" aria-hidden />
              Criar usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
