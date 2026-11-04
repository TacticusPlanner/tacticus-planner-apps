import * as React from "react"

// The exact complement of Tailwind's `md:` (`width >= 48rem`), which the desktop Sidebar uses to
// show itself. A px query (`max-width: 767px`) left a gap where neither matched: fractional widths
// from zoom/display scaling (767.5px), or a larger browser default font size (48rem > 768px). In
// that gap the desktop shell rendered but its sidebar stayed `hidden`, so navigation vanished.
const MOBILE_QUERY = "(width < 48rem)"

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileQuery,
    getIsMobile,
    () => false
  )
}

function subscribeToMobileQuery(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY)

  mediaQuery.addEventListener("change", onStoreChange)

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange)
  }
}

function getIsMobile() {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia(MOBILE_QUERY).matches
}
