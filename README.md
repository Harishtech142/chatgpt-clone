# ChatGPT-style chat app

A ChatGPT-style chat interface built with React, TypeScript, Tailwind CSS, and
shadcn-style UI primitives. It sends every message to your n8n webhook and
renders only the reply text — no JSON, no metadata, no raw payloads.

## Features

- ChatGPT-style layout: collapsible sidebar, chat history grouped by date, main chat panel
- Light / dark / system theme, persisted across reloads
- New chat, rename chat, delete chat (with confirmation)
- Chat history and theme saved to `localStorage` and restored on refresh
- Auto-resizing input box — Enter sends, Shift+Enter adds a new line
- Typing indicator while waiting on the webhook
- Auto-scroll to the latest message (pauses if you've scrolled up to read)
- Markdown rendering with GitHub-flavored markdown and code syntax highlighting
- Copy button on every message, Regenerate button on the last assistant reply
- Error handling with a Retry button if the webhook call fails or times out
- Parses **all four** response formats from the webhook automatically:
  `{ response }`, `{ message }`, `{ output }`, or plain text — plus a few
  common variants (`{ text }`, `{ reply }`, OpenAI-style `choices[0].message.content`, etc.)

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## How it talks to your webhook

The webhook URL is now set in the project root `.env` file using:

```bash
VITE_WEBHOOK_URL=https://harishsingh010101.app.n8n.cloud/webhook-test/2d02cd50-7196-4943-9c4b-a86a3eac40e0
```

The app reads it from `import.meta.env.VITE_WEBHOOK_URL` in `src/lib/webhook.ts`.

On every message, the app sends:

```json
{ "message": "user message", "chatId": "unique_chat_id" }
```

and reads the reply from whatever shape the webhook returns. You don't need to
change anything in your n8n workflow to match a specific format — the parser
in `src/lib/webhook.ts` (`extractText`) walks the response and pulls out the
first usable string, in this order of priority: `response`, `message`,
`output`, `text`, `reply`, `answer`, `result`, `content`, nested objects/arrays
of any of those, OpenAI-style `choices[].message.content`, or a plain-text body.

**Note on the n8n test webhook URL:** n8n's `webhook-test` URLs only stay
active while you have the workflow open in the n8n editor with "Listen for
test event" running, and only respond to a single call before going inactive
again. For a chat app people will actually use, switch to the **production**
webhook URL (the one under the "Production URL" tab once your workflow is
activated) and update `WEBHOOK_URL` accordingly.

## CORS

Since this app calls the webhook directly from the browser, your n8n webhook
node needs to allow cross-origin requests from wherever you host this app
(e.g. `http://localhost:5173` while developing). In the n8n Webhook node
settings, set **Response Headers** to include:

```
Access-Control-Allow-Origin: *
```

(or your specific domain instead of `*`). Without this, the browser will
block the response and the app will show a connection error with a Retry
button.

## Where things live

```
src/
  components/        UI components (sidebar, message list, input, etc.)
  components/ui/      Small reusable primitives (button, dropdown, dialog, textarea)
  hooks/              useChats (all chat state + webhook calls), useTheme
  lib/
    webhook.ts         Webhook call + response-format parsing
    storage.ts         localStorage read/write for chats + theme
    types.ts           Shared TypeScript types
    utils.ts           Tailwind class helper
  App.tsx              Top-level layout, wires hooks to components
```

## Notes

- Chat history lives entirely in your browser's `localStorage` — clearing
  browser storage clears chat history. There's no backend database in this
  project; add one if you need history to follow a user across devices.
- The "Regenerate" button re-sends the original user message that produced
  the last assistant reply and replaces it with a fresh response.
- If the webhook returns an error status or an unparseable body, the app
  shows an inline error bubble with a Retry button instead of crashing or
  showing raw error output.
