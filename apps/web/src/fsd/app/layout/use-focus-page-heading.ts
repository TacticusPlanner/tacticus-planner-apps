import { useEffect, useRef } from "react"
import { useLocation } from "react-router"

import { useTour } from "@/shared/tour"

/** id of the shell's page `h1` (desktop and mobile header), the target of route-change focus. */
export const PAGE_HEADING_ID = "page-heading"

/**
 * Moves focus to the shell's page heading after a client-side route change, so screen readers
 * announce the new page. Compares against the previous pathname (not a first-render flag) so the
 * initial load and Strict Mode's double effect never move focus, and search-param-only changes
 * keep focus where it is. Skips while a dialog holds focus or the tour overlay is running.
 */
export function useFocusPageHeadingOnNavigate() {
  const { pathname } = useLocation()
  const { isRunning } = useTour()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    if (isRunning) return
    if (document.activeElement?.closest('[role="dialog"],[role="alertdialog"]'))
      return
    document.getElementById(PAGE_HEADING_ID)?.focus({ preventScroll: true })
  }, [pathname, isRunning])
}
