import { useEffect } from "react"

import { safeStorage, storageKeys } from "@/shared/lib"

/** Account data (`tp.user.`, sign-out removes it): which pages someone opens is theirs, not the
 *  browser's. */
const STORAGE_KEY = storageKeys.userNavRecentPages

/** How many recent pages navigation search lists, not counting the page you are on. */
export const RECENT_PAGES_SHOWN = 3
// One more than shown, so the list stays full while you are on one of them.
const RECENT_PAGES_KEPT = RECENT_PAGES_SHOWN + 1

// Used when storage refuses the write (private window, blocked site data), for this visit only.
let inMemory: string[] = []

function isPathList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  )
}

/** The recently visited page paths, most recent first. Unreadable storage reads as the in-memory
 *  list. */
export function readRecentPages(): string[] {
  const raw = safeStorage.get(STORAGE_KEY)
  if (raw === null) return inMemory
  try {
    const parsed: unknown = JSON.parse(raw)
    return isPathList(parsed) ? parsed.slice(0, RECENT_PAGES_KEPT) : inMemory
  } catch {
    return inMemory
  }
}

/** Moves `path` to the front of the recent pages. */
export function recordRecentPage(path: string): void {
  const next = [
    path,
    ...readRecentPages().filter((entry) => entry !== path),
  ].slice(0, RECENT_PAGES_KEPT)
  inMemory = next
  safeStorage.set(STORAGE_KEY, JSON.stringify(next))
}

/** Records the page being viewed (a navigation route's path, or nothing off the menu). */
export function useRecordRecentPage(path: string | undefined): void {
  useEffect(() => {
    if (path) recordRecentPage(path)
  }, [path])
}

/** Forgets the in-memory fallback (tests). */
export function resetRecentPagesForTests(): void {
  inMemory = []
}
