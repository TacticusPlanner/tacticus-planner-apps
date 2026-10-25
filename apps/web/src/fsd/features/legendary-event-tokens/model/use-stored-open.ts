import { useCallback, useState } from "react"
import { safeStorage } from "@/shared/lib"

function readOpen(key: string, defaultOpen: boolean): boolean {
  const stored = safeStorage.get(key)
  return stored === null ? defaultOpen : stored === "true"
}

/** A section's open state, remembered per device in `localStorage` (design D7); `defaultOpen`
 *  (collapsed unless set) until the user toggles it, and when storage is unavailable. */
export function useStoredOpen(
  key: string,
  defaultOpen = false
): [open: boolean, setOpen: (open: boolean) => void] {
  const [open, setOpenState] = useState(() => readOpen(key, defaultOpen))
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next)
      // Private mode or blocked storage: the section still toggles for this visit.
      safeStorage.set(key, String(next))
    },
    [key]
  )
  return [open, setOpen]
}
