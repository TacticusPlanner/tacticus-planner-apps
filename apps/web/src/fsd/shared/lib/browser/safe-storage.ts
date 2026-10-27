/**
 * `localStorage` that never throws (spec: browser-storage-resilience): a browser that blocks site
 * data, a private window or a full quota reads as "nothing stored" and drops writes, so callers fall
 * back to their in-memory defaults.
 */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Best effort: the caller's in-memory value still applies for this visit.
    }
  },
  /** `set` that reports whether the write landed, for callers that tell the player it did not. */
  trySet(key: string, value: string): boolean {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Best effort, as above.
    }
  },
}
