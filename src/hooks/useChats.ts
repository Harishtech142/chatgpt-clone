import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import type { Chat, ChatMessage } from '@/lib/types'
import { loadChats, saveChats } from '@/lib/storage'
import { sendMessageToWebhook, WebhookError } from '@/lib/webhook'

function makeTitleFromMessage(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ')
  if (cleaned.length <= 48) return cleaned || 'New chat'
  return cleaned.slice(0, 48).trimEnd() + '…'
}

function createEmptyChat(): Chat {
  const now = Date.now()
  return {
    id: uuid(),
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>(() => {
    const loaded = loadChats()
    return loaded
  })
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => loadChats()[0]?.id ?? null
  )
  const [pendingChatIds, setPendingChatIds] = useState<Set<string>>(new Set())
  const abortControllers = useRef<Map<string, AbortController>>(new Map())

  // Persist whenever chats change.
  useEffect(() => {
    saveChats(chats)
  }, [chats])

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null
  const isActivePending = activeChatId
    ? pendingChatIds.has(activeChatId)
    : false

  const updateChat = useCallback(
    (chatId: string, updater: (chat: Chat) => Chat) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? updater(c) : c))
      )
    },
    []
  )

  const newChat = useCallback(() => {
    const chat = createEmptyChat()
    setChats((prev) => [chat, ...prev])
    setActiveChatId(chat.id)
    return chat.id
  }, [])

  const selectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId)
  }, [])

  const deleteChat = useCallback(
    (chatId: string) => {
      const controller = abortControllers.current.get(chatId)
      if (controller) {
        controller.abort()
        abortControllers.current.delete(chatId)
      }
      setChats((prev) => {
        const next = prev.filter((c) => c.id !== chatId)
        if (activeChatId === chatId) {
          setActiveChatId(next[0]?.id ?? null)
        }
        return next
      })
    },
    [activeChatId]
  )

  const renameChat = useCallback(
    (chatId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      updateChat(chatId, (c) => ({ ...c, title: trimmed, updatedAt: Date.now() }))
    },
    [updateChat]
  )

  const runAssistantReply = useCallback(
    async (chatId: string, userMessage: ChatMessage) => {
      const controller = new AbortController()
      abortControllers.current.set(chatId, controller)
      setPendingChatIds((prev) => new Set(prev).add(chatId))

      try {
        const { text } = await sendMessageToWebhook(
          userMessage.content,
          chatId,
          controller.signal
        )
        const assistantMsg: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content: text,
          createdAt: Date.now(),
          sourceUserMessageId: userMessage.id,
        }
        updateChat(chatId, (c) => ({
          ...c,
          messages: [...c.messages, assistantMsg],
          updatedAt: Date.now(),
        }))
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const errorText =
          err instanceof WebhookError
            ? err.message
            : 'Something went wrong. Please try again.'
        const assistantMsg: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content: '',
          error: errorText,
          createdAt: Date.now(),
          sourceUserMessageId: userMessage.id,
        }
        updateChat(chatId, (c) => ({
          ...c,
          messages: [...c.messages, assistantMsg],
          updatedAt: Date.now(),
        }))
      } finally {
        abortControllers.current.delete(chatId)
        setPendingChatIds((prev) => {
          const next = new Set(prev)
          next.delete(chatId)
          return next
        })
      }
    },
    [updateChat]
  )

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      let chatId = activeChatId
      let isNewChat = false

      if (!chatId) {
        const chat = createEmptyChat()
        chatId = chat.id
        isNewChat = true
        setChats((prev) => [chat, ...prev])
        setActiveChatId(chat.id)
      }

      const userMsg: ChatMessage = {
        id: uuid(),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      }

      updateChat(chatId, (c) => ({
        ...c,
        messages: [...c.messages, userMsg],
        title:
          c.messages.length === 0 || isNewChat
            ? makeTitleFromMessage(trimmed)
            : c.title,
        updatedAt: Date.now(),
      }))

      void runAssistantReply(chatId, userMsg)
    },
    [activeChatId, runAssistantReply, updateChat]
  )

  const regenerateLastResponse = useCallback(
    (chatId: string) => {
      const chat = chats.find((c) => c.id === chatId)
      if (!chat) return

      // Find the last assistant message and the user message that triggered it.
      const lastAssistantIndex = [...chat.messages]
        .map((m, i) => ({ m, i }))
        .reverse()
        .find(({ m }) => m.role === 'assistant')?.i

      if (lastAssistantIndex === undefined) return

      const lastAssistantMsg = chat.messages[lastAssistantIndex]
      const sourceId = lastAssistantMsg.sourceUserMessageId
      const userMsg = chat.messages.find((m) => m.id === sourceId)
      if (!userMsg) return

      // Remove the failed/old assistant message, then regenerate.
      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.filter((m) => m.id !== lastAssistantMsg.id),
      }))

      void runAssistantReply(chatId, userMsg)
    },
    [chats, runAssistantReply, updateChat]
  )

  const stopGenerating = useCallback((chatId: string) => {
    const controller = abortControllers.current.get(chatId)
    if (controller) {
      controller.abort()
      abortControllers.current.delete(chatId)
    }
    setPendingChatIds((prev) => {
      const next = new Set(prev)
      next.delete(chatId)
      return next
    })
  }, [])

  return {
    chats,
    activeChat,
    activeChatId,
    isActivePending,
    pendingChatIds,
    newChat,
    selectChat,
    deleteChat,
    renameChat,
    sendMessage,
    regenerateLastResponse,
    stopGenerating,
  }
}
