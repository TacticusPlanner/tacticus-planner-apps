/**
 * localStorage keys that hold the signed-in account's own data start with this prefix, so sign-out
 * removes them with the rest of the account's local copy. Per-browser preferences use any other key.
 */
export const accountStoragePrefix = "tp.session."

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
  removeByPrefix(prefix: string): void {
    try {
      const { localStorage } = window
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(prefix)
      )
      for (const key of keys) localStorage.removeItem(key)
    } catch {
      // Best effort, as above.
    }
  },
}

// Dailies progress predates the prefix rule, so it sat under plain keys that sign-out kept and the
// next account on the browser inherited. Each now lives at the same name under the prefix.
const LEGACY_ACCOUNT_KEYS = [
  "tp.dailies.hse.averages.v1",
  "tp.dailies.hse.progress.v2",
  "tp.dailies.hse.tokens.v1",
  "tp.dailies.hre.progress.v1",
  "tp.dailies.quest.progress.v1",
] as const

/** The prefixed key a legacy `tp.<name>` account key moved to. */
export function accountStorageKey(name: string): string {
  return `${accountStoragePrefix}${name}`
}

/** Moves account data stored under a pre-prefix key to its prefixed name, once, before the app reads
 *  it. A value already at the new name wins; the legacy key is removed either way. */
export function migrateLegacyAccountKeys(): void {
  for (const legacy of LEGACY_ACCOUNT_KEYS) {
    const value = safeStorage.get(legacy)
    if (value === null) continue
    const next = accountStorageKey(legacy.slice("tp.".length))
    if (safeStorage.get(next) === null) safeStorage.set(next, value)
    safeStorage.remove(legacy)
  }
}
