export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2" aria-label="Assistant is typing">
      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-bounce [animation-delay:-0.32s]" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-bounce [animation-delay:-0.16s]" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-bounce" />
    </div>
  )
}
