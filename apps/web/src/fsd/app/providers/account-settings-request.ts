import { useEffect, useRef } from "react"

const listeners = new Set<() => void>()

/** Asks the mounted account control to open Account settings (navigation search's quick action).
 *  Does nothing when no account control is mounted, such as for a guest. */
export function requestAccountSettings(): void {
  for (const listener of listeners) listener()
}

/** Opens Account settings when `requestAccountSettings` is called, while the caller is mounted. */
export function useAccountSettingsRequest(onRequest: () => void): void {
  const latest = useRef(onRequest)
  useEffect(() => {
    latest.current = onRequest
  })
  useEffect(() => {
    const listener = () => latest.current()
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
}
