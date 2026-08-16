import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Routing is client-side, so the window keeps whatever offset the previous
 * screen had — navigating from a scrolled list into another page lands you
 * mid-page. Reset on every route change, and disable the browser's own
 * restoration so a reload starts at the top instead of the last offset.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
