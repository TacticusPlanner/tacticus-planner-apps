import * as React from "react"

// The primary input is touch (phones, tablets). Unlike `useIsMobile`, this is about how the user
// points, not how wide the screen is: a touch tablet is wide, a narrow desktop window still has a mouse.
const COARSE_POINTER_QUERY = "(pointer: coarse)"

export function useIsCoarsePointer() {
  return React.useSyncExternalStore(
    subscribeToCoarsePointerQuery,
    getIsCoarsePointer,
    () => false
  )
}

function subscribeToCoarsePointerQuery(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(COARSE_POINTER_QUERY)

  mediaQuery.addEventListener("change", onStoreChange)

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange)
  }
}

function getIsCoarsePointer() {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia(COARSE_POINTER_QUERY).matches
}
