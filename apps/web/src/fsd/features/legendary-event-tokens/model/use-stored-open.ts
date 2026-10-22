import { useCallback, useState } from "react"
import { safeStorage } from "@/shared/lib"

function readOpen(key: string): boolean {
  return safeStorage.get(key) === "true"
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
      // Private mode or blocked storage: the section still toggles for this visit.
      safeStorage.set(key, String(next))
    },
    [key]
  )
  return [open, setOpen]
}
