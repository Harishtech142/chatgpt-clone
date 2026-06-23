import { Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'Explain a concept to me simply',
  'Help me write a professional email',
  'Brainstorm ideas for a project',
  'Summarize a piece of text',
]

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles size={22} />
      </div>
      <h1 className="text-2xl font-semibold">How can I help you today?</h1>
      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="rounded-xl border border-border px-4 py-3 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
