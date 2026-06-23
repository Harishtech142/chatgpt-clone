import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check, RotateCcw, AlertCircle } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: ChatMessage
  isLastAssistant: boolean
  onRegenerate: () => void
}

export function MessageBubble({
  message,
  isLastAssistant,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable, ignore
    }
  }

  return (
    <div
      className={cn(
        'group flex w-full gap-3 px-4 py-5 animate-fade-in',
        isUser ? '' : 'bg-surface/60'
      )}
    >
      <Avatar role={message.role} />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-sm font-semibold">
          {isUser ? 'You' : 'Assistant'}
        </p>

        {message.error ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{message.error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={onRegenerate}
            >
              <RotateCcw size={14} />
              Retry
            </Button>
          </div>
        ) : (
          <div className="prose-chat max-w-none break-words text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {!message.error && (
          <div
            className={cn(
              'mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
              isLastAssistant && 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
            )}
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Copy response"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {!isUser && isLastAssistant && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Regenerate response"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
