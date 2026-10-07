'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { LogOut, Menu, Moon, Sun, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { authApiService } from '@/modules/auth/client/services/auth-api.service';
import { ROTULO_PAPEL } from '@/modules/auth/domain/value-objects/papel.vo';
import type { PapelValue } from '@/modules/auth/domain/value-objects/papel.vo';
import { useAutenticacao } from '@/client/providers/auth-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { initials } from '@/shared/utils/string.util';
import { AppSidebar } from './app-sidebar.component';

export type AppHeaderProps = { redeNome: string };

export function AppHeader({ redeNome }: AppHeaderProps) {
  const router = useRouter();
  const { usuario } = useAutenticacao();
  const { theme, setTheme } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);

  async function sair(): Promise<void> {
    await authApiService.sair();
    toast.success('Sessão encerrada');
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between gap-3 border-b bg-header px-4">
      <div className="flex items-center gap-2">
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Menu principal</SheetTitle>
            <AppSidebar redeNome={redeNome} aoNavegar={() => setMenuAberto(false)} />
          </SheetContent>
        </Sheet>
        <p className="hidden text-sm text-muted-foreground sm:block">{redeNome}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Alternar tema"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 dark:hidden" aria-hidden />
          <Moon className="hidden h-5 w-5 dark:block" aria-hidden />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2" aria-label="Menu do usuário">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials({ value: usuario?.nome ?? '' })}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[160px] truncate text-sm font-medium sm:block">
                {usuario?.nome}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="space-y-1">
              <p className="truncate text-sm">{usuario?.email}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {usuario ? ROTULO_PAPEL[usuario.role as PapelValue] : ''}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/configuracoes')}>
              <UserRound className="h-4 w-4" aria-hidden />
              Minha conta
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void sair()}>
              <LogOut className="h-4 w-4" aria-hidden />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
