import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Starts each new screen at the top; back/forward (POP) keeps the browser's restored position. */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
