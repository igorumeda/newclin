'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Check, ChevronDown, LogOut, Menu, Monitor, Moon, Sun, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/client/ui/button';
import { Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@/client/ui/overlay';
import { ROLE_LABELS, type AppRole } from '@/modules/user/domain/value-objects/role.vo';
import { useAuth } from '@/client/providers/auth-provider';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { useUiStore } from '@/client/stores/ui.store';

function SeletorUnidade() {
  const { unidades, unidade, definirUnidade, multiplas } = useUnidadeAtiva();

  if (!multiplas || !unidade) {
    return unidade ? (
      <span className="hidden items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground sm:inline-flex">
        {unidade.nome}
      </span>
    ) : null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[16rem]">
          <span className="truncate">{unidade.nome}</span>
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Unidade ativa</DropdownMenuLabel>
        {unidades.map((item) => (
          <DropdownMenuItem key={item.id} onClick={() => definirUnidade(item.id)}>
            <span className="flex-1 truncate">{item.nome}</span>
            {item.id === unidade.id ? <Check aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AlternarTema() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Alternar tema">
              <Sun className="size-4 dark:hidden" aria-hidden />
              <Moon className="hidden size-4 dark:block" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Alternar tema</TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun aria-hidden />
          Claro
          {theme === 'light' ? <Check className="ml-auto" aria-hidden /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon aria-hidden />
          Escuro
          {theme === 'dark' ? <Check className="ml-auto" aria-hidden /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor aria-hidden />
          Sistema
          {theme === 'system' ? <Check className="ml-auto" aria-hidden /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const router = useRouter();
  const { nome, email, papel, sair } = useAuth();
  const abrirMenuMobile = useUiStore((estado) => estado.abrirMenuMobile);

  const [saindo, setSaindo] = React.useState(false);

  async function aoSair() {
    setSaindo(true);
    try {
      await sair();
      router.replace('/login');
    } catch {
      toast.error('Não foi possível encerrar a sessão');
    } finally {
      setSaindo(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur sm:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={abrirMenuMobile}
        aria-label="Abrir menu"
      >
        <Menu aria-hidden />
      </Button>

      <div className="flex-1" />

      <SeletorUnidade />
      <AlternarTema />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md p-1 pl-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Menu do usuário"
          >
            <span className="hidden text-right sm:block">
              <span className="block max-w-[12rem] truncate text-sm font-medium">{nome ?? '—'}</span>
              <span className="block text-xs text-muted-foreground">
                {papel ? ROLE_LABELS[papel as AppRole] : ''}
              </span>
            </span>
            <Avatar nome={nome ?? '?'} className="size-9" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-foreground">
            <span className="block text-sm font-medium">{nome ?? '—'}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{email ?? ''}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/perfil')}>
            <User aria-hidden />
            Meu perfil
          </DropdownMenuItem>
          <DropdownMenuItem variante="destructive" onClick={aoSair} disabled={saindo}>
            <LogOut aria-hidden />
            {saindo ? 'Saindo…' : 'Sair'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
