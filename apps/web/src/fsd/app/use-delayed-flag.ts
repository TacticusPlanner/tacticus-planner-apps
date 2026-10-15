import { useEffect, useState } from "react"

/**
 * True once `active` has stayed true for `delayMs`; false again as soon as it turns false. Used to
 * add a "taking longer than usual" note to a loading state only when it actually is slow.
 */
export function useDelayedFlag(active: boolean, delayMs: number) {
  const [elapsed, setElapsed] = useState(false)

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => setElapsed(true), delayMs)
    return () => {
      window.clearTimeout(timer)
      setElapsed(false)
    }
  }, [active, delayMs])

  return active && elapsed
}
