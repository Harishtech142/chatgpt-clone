import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/types'
import { MessageBubble } from '@/components/MessageBubble'
import { TypingIndicator } from '@/components/TypingIndicator'
import { Avatar } from '@/components/Avatar'

interface MessageListProps {
  messages: ChatMessage[]
  isPending: boolean
  onRegenerate: () => void
}

export function MessageList({
  messages,
  isPending,
  onRegenerate,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastMessageCount = useRef(messages.length)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Only auto-scroll if the user is already near the bottom, or a new
    // message just arrived (so we don't yank the view while reading back).
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    const isNearBottom = distanceFromBottom < 150
    const messageCountChanged = messages.length !== lastMessageCount.current

    if (isNearBottom || messageCountChanged) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    lastMessageCount.current = messages.length
  }, [messages, isPending])

  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-thin"
    >
      <div className="mx-auto flex max-w-3xl flex-col">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLastAssistant={message.id === lastAssistantId}
            onRegenerate={onRegenerate}
          />
        ))}

        {isPending && (
          <div className="flex w-full gap-3 bg-surface/60 px-4 py-5">
            <Avatar role="assistant" />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-semibold">Assistant</p>
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
