import {
  createContext,
  useCallback,
  useContext,
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

/** Reads the current state of the <html> class applied by the inline index.html script. */
function getInitialDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(getInitialDark)

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }, [])

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode(): DarkModeContextValue {
  return useContext(DarkModeContext)
}
