import type { ResolvedTheme, ThemeMode } from './theme'
import { useEffect, useMemo, useState } from 'react'
import {
  applyTheme,
  getSystemTheme,
  isThemeMode,
  persistTheme,
  readStoredTheme,
  SYSTEM_THEME_QUERY,
  THEME_STORAGE_KEY,
} from './theme'
import { ThemeContext } from './ThemeContext'

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeMode>('system')
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light')
  const [initialized, setInitialized] = useState(false)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(SYSTEM_THEME_QUERY)
    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    const syncTheme = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return
      if (event.storageArea && event.storageArea !== window.localStorage) return
      setTheme(isThemeMode(event.newValue) ? event.newValue : 'system')
    }

    mediaQuery?.addEventListener('change', updateSystemTheme)
    window.addEventListener('storage', syncTheme)
    /* eslint-disable react/set-state-in-effect -- Restore browser preferences only after the deterministic hydration render. */
    setTheme(readStoredTheme())
    setSystemTheme(getSystemTheme())
    setInitialized(true)
    /* eslint-enable react/set-state-in-effect */

    return () => {
      mediaQuery?.removeEventListener('change', updateSystemTheme)
      window.removeEventListener('storage', syncTheme)
    }
  }, [])

  useEffect(() => {
    if (initialized) applyTheme(resolvedTheme)
  }, [initialized, resolvedTheme])

  useEffect(() => {
    if (initialized) persistTheme(theme)
  }, [initialized, theme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, theme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
