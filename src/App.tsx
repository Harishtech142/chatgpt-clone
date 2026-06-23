import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { MessageList } from '@/components/MessageList'
import { ChatInput } from '@/components/ChatInput'
import { EmptyState } from '@/components/EmptyState'
import { useChats } from '@/hooks/useChats'
import { useTheme } from '@/hooks/useTheme'

export default function App() {
  const {
    chats,
    activeChat,
    activeChatId,
    isActivePending,
    newChat,
    selectChat,
    deleteChat,
    renameChat,
    sendMessage,
    regenerateLastResponse,
    stopGenerating,
  } = useChats()
  const { theme, setTheme } = useTheme()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function handleSend(text: string) {
    sendMessage(text)
  }

  function handleRegenerate() {
    if (activeChatId) regenerateLastResponse(activeChatId)
  }

  function handleStop() {
    if (activeChatId) stopGenerating(activeChatId)
  }

  const hasMessages = (activeChat?.messages.length ?? 0) > 0

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Header
          title={activeChat?.title ?? 'New chat'}
          theme={theme}
          onSetTheme={setTheme}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {hasMessages ? (
          <MessageList
            messages={activeChat!.messages}
            isPending={isActivePending}
            onRegenerate={handleRegenerate}
          />
        ) : (
          <EmptyState onSuggestionClick={handleSend} />
        )}

        <ChatInput
          onSend={handleSend}
          isPending={isActivePending}
          onStop={handleStop}
        />
      </div>
    </div>
  )
}
