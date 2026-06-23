const globalProcess = (globalThis as any).process;
export const WEBHOOK_URL =
  import.meta.env.VITE_WEBHOOK_URL || globalProcess?.env?.WEBHOOK_URL;
  
export class WebhookError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'WebhookError'
    this.status = status
  }
}


/**
 * Recursively hunts for a usable text reply inside an arbitrary JSON payload.
 * Handles the documented formats:
 *   { response: "..." } | { message: "..." } | { output: "..." } | plain text
 * and tolerates extra nesting some n8n workflows produce, e.g.
 *   [{ output: "..." }]  |  { data: { response: "..." } }  |  { choices: [{ message: { content: "..." } }] }
 */
function extractText(payload: unknown): string | null {
  if (payload == null) return null

  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof payload === 'number' || typeof payload === 'boolean') {
    return String(payload)
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractText(item)
      if (found) return found
    }
    return null
  }

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>

    const directKeys = [
      'response',
      'message',
      'output',
      'text',
      'reply',
      'answer',
      'result',
      'content',
    ]

    for (const key of directKeys) {
      if (key in obj) {
        const value = obj[key]
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim()
        }
        if (value && typeof value === 'object') {
          const nested = extractText(value)
          if (nested) return nested
        }
      }
    }

    // OpenAI-style choices[].message.content
    if ('choices' in obj) {
      const nested = extractText(obj.choices)
      if (nested) return nested
    }

    // Fallback: scan remaining values for the first usable string/object
    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim()
      }
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') {
        const nested = extractText(value)
        if (nested) return nested
      }
    }
  }

  return null
}

export interface SendMessageResult {
  text: string
}

export async function sendMessageToWebhook(
  message: string,
  chatId: string,
  signal?: AbortSignal
): Promise<SendMessageResult> {
  let res: Response
  try {
    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chatId }),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }
    throw new WebhookError(
      'Could not reach the server. Check your connection and try again.'
    )
  }

  const rawBody = await res.text()

  if (!res.ok) {
    throw new WebhookError(
      `The server returned an error (${res.status}). Please try again.`,
      res.status
    )
  }

  // Try JSON first; fall back to treating the body as plain text.
  let parsed: unknown = rawBody
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    parsed = rawBody
  }

  const text = extractText(parsed)

  if (!text) {
    throw new WebhookError(
      "The server responded but didn't include any readable text."
    )
  }

  return { text }
}
