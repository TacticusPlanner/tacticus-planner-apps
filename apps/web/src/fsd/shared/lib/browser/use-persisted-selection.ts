import { useCallback, useState } from "react"
import { safeStorage } from "./safe-storage"

/**
 * A string-union preference persisted per browser under `storageKey`, so it survives navigating
 * away from the page and a full reload instead of resetting to `fallback` every time the component
 * remounts. Degrades to an in-memory `fallback` when `localStorage` is unavailable (a private
 * window, a browser blocking site data) or holds something `isValid` rejects. Give every caller its
 * own `storageKey` so unrelated preferences don't share a slot.
 */
export function usePersistedSelection<T extends string>(
  storageKey: string,
  isValid: (value: unknown) => value is T,
  fallback: T
): [T, (next: T) => void] {
  const read = useCallback((): T => {
    const raw = safeStorage.get(storageKey)
    return isValid(raw) ? raw : fallback
  }, [storageKey, isValid, fallback])

  const [value, setValueState] = useState<T>(read)
  const setValue = useCallback(
    (next: T) => {
      setValueState(next)
      // Best-effort — the in-memory value still updates.
      safeStorage.set(storageKey, next)
    },
    [storageKey]
  )
  return [value, setValue]
}
