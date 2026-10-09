import { useEffect, useRef, useState } from "react"

/** How long a rapid run of edits (stepper clicks) waits before it is sent as one write. */
const DEBOUNCED_COMMIT_DELAY_MS = 400

/**
 * A locally edited copy of `value` whose edits are committed once, `delayMs` after the last one,
 * rather than on every change — so clicking a stepper five times sends one request with the final
 * value. A run that ends on the starting value commits nothing, and an edit still waiting when the
 * component unmounts is committed then rather than lost. Returns the value to show and the setter.
 */
export function useDebouncedCommit<T>(
  value: T,
  commit: (next: T) => void,
  delayMs = DEBOUNCED_COMMIT_DELAY_MS
): [T, (next: T) => void] {
  const [pending, setPending] = useState<{ value: T } | null>(null)
  // Read by the timer and the unmount flush, so neither commits a stale callback or value.
  const latest = useRef({ commit, value, pending })
  useEffect(() => {
    latest.current = { commit, value, pending }
  })

  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => {
      latest.current.pending = null
      setPending(null)
      if (!Object.is(pending.value, latest.current.value)) {
        latest.current.commit(pending.value)
      }
    }, delayMs)
    return () => clearTimeout(timer)
  }, [pending, delayMs])

  useEffect(
    () => () => {
      const { pending: unsent, value: current, commit: send } = latest.current
      if (unsent && !Object.is(unsent.value, current)) send(unsent.value)
    },
    []
  )

  return [
    pending ? pending.value : value,
    (next) => setPending({ value: next }),
  ]
}
