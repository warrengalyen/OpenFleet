import { useEffect } from 'react'

const APP_NAME = 'OpenFleet'

/** Set `document.title` for the current page; restored on unmount. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title.includes(APP_NAME) ? title : `${title} | ${APP_NAME}`
    return () => {
      document.title = previous
    }
  }, [title])
}
