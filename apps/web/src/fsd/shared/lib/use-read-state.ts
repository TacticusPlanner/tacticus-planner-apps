import { useCallback, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"

/** A local read's state: `loading` until the first result, then `ready` or `error`. */
export type ReadState<T> =
  | { status: "loading"; retry: () => void }
  | { status: "error"; retry: () => void }
  | { status: "ready"; data: T; retry: () => void }

type Settled<T> = { status: "ready"; data: T } | { status: "error" }

/**
 * `useLiveQuery` with an error channel and a retry: `useLiveQuery` reports "still loading" as
 * `undefined` and throws a rejected querier to the error boundary, so the querier resolves a tagged
 * result instead (like `use-active-home-screen-event.ts`). `retry` re-issues the read.
 */
export function useReadState<T>(
  querier: () => Promise<T>,
  deps: unknown[]
): ReadState<T> {
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  const result = useLiveQuery(
    (): Promise<Settled<T>> =>
      querier().then(
        (data) => ({ status: "ready", data }),
        () => ({ status: "error" })
      ),
    [...deps, attempt]
  )
  if (!result) return { status: "loading", retry }
  return { ...result, retry }
}
