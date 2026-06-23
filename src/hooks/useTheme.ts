import { useCallback, useEffect, useState } from 'react'
import type { Theme } from '@/lib/types'
import { loadTheme, saveTheme } from '@/lib/storage'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => loadTheme())

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const isDarkNow =
        prev === 'dark' ||
        (prev === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      return isDarkNow ? 'light' : 'dark'
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}
