import { useCallback, useState } from "react"

function readOpen(key: string): boolean {
  try {
    return globalThis.localStorage.getItem(key) === "true"
  } catch {
    return false
  }
}

/** A section's open state, remembered per device in `localStorage` (design D7); collapsed by
 *  default and when storage is unavailable. */
export function useStoredOpen(
  key: string
): [open: boolean, setOpen: (open: boolean) => void] {
  const [open, setOpenState] = useState(() => readOpen(key))
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next)
      try {
        globalThis.localStorage.setItem(key, String(next))
      } catch {
        // Private mode or blocked storage: the section still toggles for this visit.
      }
    },
    [key]
  )
  return [open, setOpen]
}
