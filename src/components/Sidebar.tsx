import { useState } from 'react'
import {
  SquarePen,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Check,
  X,
} from 'lucide-react'
import type { Chat } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface SidebarProps {
  chats: Chat[]
  activeChatId: string | null
  collapsed: boolean
  onToggleCollapsed: () => void
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onRenameChat: (id: string, title: string) => void
  onDeleteChat: (id: string) => void
  /** mobile overlay mode */
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

function groupChatsByDate(chats: Chat[]) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const groups: { label: string; chats: Chat[] }[] = [
    { label: 'Today', chats: [] },
    { label: 'Yesterday', chats: [] },
    { label: 'Previous 7 days', chats: [] },
    { label: 'Older', chats: [] },
  ]

  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)

  for (const chat of sorted) {
    const updated = new Date(chat.updatedAt)
    if (updated >= startOfToday) groups[0].chats.push(chat)
    else if (updated >= startOfYesterday) groups[1].chats.push(chat)
    else if (updated >= sevenDaysAgo) groups[2].chats.push(chat)
    else groups[3].chats.push(chat)
  }

  return groups.filter((g) => g.chats.length > 0)
}

export function Sidebar({
  chats,
  activeChatId,
  collapsed,
  onToggleCollapsed,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Chat | null>(null)

  const groups = groupChatsByDate(chats)

  function startRename(chat: Chat) {
    setRenamingId(chat.id)
    setRenameValue(chat.title)
  }

  function commitRename() {
    if (renamingId) {
      onRenameChat(renamingId, renameValue)
    }
    setRenamingId(null)
  }

  const content = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-1 p-2">
        <button
          onClick={onNewChat}
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent transition-colors"
        >
          <SquarePen size={16} />
          {!collapsed && <span>New chat</span>}
        </button>
        <button
          onClick={onToggleCollapsed}
          className="hidden md:flex items-center justify-center rounded-lg p-2.5 hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="flex md:hidden items-center justify-center rounded-lg p-2.5 hover:bg-sidebar-accent transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {chats.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No chats yet. Start a new conversation.
            </p>
          )}
          {groups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              {group.chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    'group relative flex items-center rounded-lg',
                    chat.id === activeChatId && 'bg-sidebar-accent'
                  )}
                >
                  {renamingId === chat.id ? (
                    <div className="flex w-full items-center gap-1 px-2 py-1.5">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={commitRename}
                        className="rounded-md p-1 hover:bg-accent"
                        aria-label="Save name"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="rounded-md p-1 hover:bg-accent"
                        aria-label="Cancel rename"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onSelectChat(chat.id)
                          onCloseMobile?.()
                        }}
                        className="flex flex-1 items-center gap-2 overflow-hidden px-3 py-2.5 text-left text-sm"
                      >
                        <MessageSquare
                          size={15}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span className="truncate">{chat.title}</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="mr-1 shrink-0 rounded-md p-1.5 opacity-0 hover:bg-accent group-hover:opacity-100 data-[state=open]:opacity-100"
                            aria-label="Chat options"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startRename(chat)}>
                            <Pencil size={14} /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            destructive
                            onClick={() => setDeleteTarget(chat)}
                          >
                            <Trash2 size={14} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete chat?"
        description={`"${deleteTarget?.title}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) onDeleteChat(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex h-full shrink-0 border-r border-sidebar-border transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-[280px]'
        )}
      >
        {content}
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-[280px] animate-slide-in">{content}</div>
          <div
            className="flex-1 bg-black/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        </div>
      )}
    </>
  )
}
