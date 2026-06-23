export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  /** present only on assistant messages that errored out */
  error?: string
  /** the user message content that produced this assistant reply, used for regenerate */
  sourceUserMessageId?: string
}

export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

export type Theme = 'light' | 'dark' | 'system'
