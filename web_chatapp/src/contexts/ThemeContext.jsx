import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

const ThemeContext = createContext({ theme: "system", setTheme: () => {} })

const THEME_STORAGE_KEY = "themePreference"

function applyTheme(theme) {
  const root = document.documentElement
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
  if (effective === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  root.setAttribute('data-theme', effective)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null
    return stored || 'system' // Back to system default
  })

  const setTheme = useCallback((value) => {
    setThemeState(value)
    try { localStorage.setItem(THEME_STORAGE_KEY, value) } catch {}
    applyTheme(value)
  }, [])

  // Apply on mount
  useEffect(() => {
    applyTheme(theme)
  }, [])

  // Update when OS theme changes and we're on system
  useEffect(() => {
    if (!(window.matchMedia)) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') applyTheme('system') }
    try { mql.addEventListener('change', handler) } catch { mql.addListener(handler) }
    return () => { try { mql.removeEventListener('change', handler) } catch { mql.removeListener(handler) } }
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)


