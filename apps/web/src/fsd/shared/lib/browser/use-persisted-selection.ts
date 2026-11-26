import { useStoredPreference } from "./stored-preference"
import type { StoredPreference } from "./stored-preference"

/**
 * A string-union preference remembered per device in its feature's preference record, so it
 * survives navigating away and a full reload instead of resetting to `fallback` on every remount.
 * Every mounted reader (and other tabs) sees a change at once. Falls back to `fallback` when
 * nothing is stored, storage is unavailable, or the stored value is one `isValid` rejects.
 */
export function usePersistedSelection<T extends string>(
  preference: StoredPreference,
  isValid: (value: unknown) => value is T,
  fallback: T
): [T, (next: T) => void] {
  return useStoredPreference(preference, (stored) =>
    isValid(stored) ? stored : fallback
  )
}
