import type { SessionStorageKey, StorageKey } from "./storage-keys"

type StorageArea = "localStorage" | "sessionStorage"

/**
 * Web storage that never throws (spec: browser-storage-resilience): a browser that blocks site
 * data, a private window or a full quota reads as "nothing stored" and drops writes, so callers fall
 * back to their in-memory defaults. This file is the only one allowed to touch `localStorage` and
 * `sessionStorage` directly (an ESLint rule enforces it).
 */
function guardedStorage<K extends string>(area: StorageArea) {
  return {
    get(key: K): string | null {
      try {
        return globalThis[area].getItem(key)
      } catch {
        return null
      }
    },
    set(key: K, value: string): void {
      try {
        globalThis[area].setItem(key, value)
      } catch {
        // Best effort: the caller's in-memory value still applies for this visit.
      }
    },
    /** `set` that reports whether the write landed, for callers that tell the player it did not. */
    trySet(key: K, value: string): boolean {
      try {
        globalThis[area].setItem(key, value)
        return true
      } catch {
        return false
      }
    },
    remove(key: K): void {
      try {
        globalThis[area].removeItem(key)
      } catch {
        // Best effort, as above.
      }
    },
    /** Every stored key starting with `prefix`; none when storage is unavailable. */
    keysStartingWith(prefix: string): string[] {
      try {
        return Object.keys(globalThis[area]).filter((key) =>
          key.startsWith(prefix)
        )
      } catch {
        return []
      }
    },
  }
}

/** `localStorage`, limited to the keys in `storage-keys.ts`. */
export const safeStorage = {
  ...guardedStorage<StorageKey>("localStorage"),
  /** Removes every key starting with `prefix` (the account's `tp.user.` data on sign-out). */
  removeByPrefix(prefix: string): void {
    const local = guardedStorage<string>("localStorage")
    for (const key of local.keysStartingWith(prefix)) local.remove(key)
  },
}

/** `sessionStorage`, limited to the keys in `storage-keys.ts`. */
export const safeSessionStorage =
  guardedStorage<SessionStorageKey>("sessionStorage")

/** Any `localStorage` key, for the startup migration of keys that are no longer registered. */
export const legacyStorage = guardedStorage<string>("localStorage")

/** Any `sessionStorage` key, for the same migration. */
export const legacySessionStorage = guardedStorage<string>("sessionStorage")

/** Whether a `storage` event reports a change to `localStorage` (not `sessionStorage`). */
export function isLocalStorageEvent(event: StorageEvent): boolean {
  try {
    return event.storageArea === window.localStorage
  } catch {
    return false
  }
}

/** Whether a `storage` event reports a change to `sessionStorage`. */
export function isSessionStorageEvent(event: StorageEvent): boolean {
  try {
    return event.storageArea === window.sessionStorage
  } catch {
    return false
  }
}
