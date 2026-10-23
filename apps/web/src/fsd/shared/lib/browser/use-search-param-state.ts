import { useCallback, useEffect } from "react"
import { useSearchParams } from "react-router"

type SearchParamHistory = "replace" | "push"

/**
 * One validated view-state value held in a URL search param (the URL is the owner, so reload, Back
 * and shared links restore it). `isValid` returns `true`/`false`, or `undefined` while the data
 * that decides it is still loading: the raw param is then kept but the fallback is returned.
 * An invalid present value is removed (replace). `set(fallback)` deletes the param; `history` picks
 * whether a change replaces the entry (filters, tabs) or pushes one (an open dialog Back closes).
 * `useGoalsProjectScope` is the async-list variant of the same rule.
 */
export function useSearchParamState<T extends string>(
  key: string,
  isValid: (value: string) => boolean | undefined,
  fallback: T,
  { history = "replace" }: { history?: SearchParamHistory } = {}
): [T, (next: T, options?: { state?: unknown }) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key)
  const validity = raw === null ? undefined : isValid(raw)

  useEffect(() => {
    if (raw === null || validity !== false) return
    setParams(
      (previous) => {
        previous.delete(key)
        return previous
      },
      { replace: true }
    )
  }, [key, raw, validity, setParams])

  const set = useCallback(
    (next: T, options?: { state?: unknown }) =>
      setParams(
        (previous) => {
          if (next === fallback) previous.delete(key)
          else previous.set(key, next)
          return previous
        },
        { replace: history === "replace", state: options?.state }
      ),
    [key, fallback, history, setParams]
  )

  return [validity === true ? (raw as T) : fallback, set]
}
