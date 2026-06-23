import type { ReactNode } from 'react'
import { Menu, Sun, Moon, Laptop } from 'lucide-react'
import type { Theme } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  title: string
  theme: Theme
  onSetTheme: (theme: Theme) => void
  onOpenMobileSidebar: () => void
}

const THEME_ICON: Record<Theme, ReactNode> = {
  light: <Sun size={16} />,
  dark: <Moon size={16} />,
  system: <Laptop size={16} />,
}

export function Header({
  title,
  theme,
  onSetTheme,
  onOpenMobileSidebar,
}: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
      <button
        onClick={onOpenMobileSidebar}
        className="flex md:hidden items-center justify-center rounded-lg p-2 hover:bg-accent"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>
      <h1 className="flex-1 truncate px-2 text-center text-sm font-medium md:text-left">
        {title}
      </h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center rounded-lg p-2 hover:bg-accent"
            aria-label="Change theme"
          >
            {THEME_ICON[theme]}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSetTheme('light')}>
            <Sun size={14} /> Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSetTheme('dark')}>
            <Moon size={14} /> Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSetTheme('system')}>
            <Laptop size={14} /> System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
