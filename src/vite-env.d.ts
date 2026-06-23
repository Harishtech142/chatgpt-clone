/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_WEBHOOK_URL?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
