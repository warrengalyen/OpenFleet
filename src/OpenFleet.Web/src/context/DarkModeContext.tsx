import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface DarkModeContextValue {
  dark: boolean
  toggle: () => void
}

const DarkModeContext = createContext<DarkModeContextValue>({
  dark: false,
  toggle: () => {},
})

/**
 * Read the class that the inline index.html script already applied.
 * Using classList instead of localStorage so the two stay in sync -
 * the script is the single source of truth on initial load.
 */
function getInitialDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(getInitialDark)

  // Keep the DOM class in sync with React state.
  // useEffect (not the state updater) is the correct place for DOM side-effects.
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const toggle = useCallback(() => setDark((d) => !d), [])

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode(): DarkModeContextValue {
  return useContext(DarkModeContext)
}
