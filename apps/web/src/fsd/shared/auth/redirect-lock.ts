import {
  safeSessionStorage,
  safeStorage,
  sessionStorageKeys,
  storageKeys,
} from "../lib"

/**
 * One tab at a time leaves for an automatic redirect (spec: redirect-authentication). When the
 * browser restores several tabs at once, each one used to find the session expired and start its own
 * redirect; the second tab's response was lost to the first one's and it bounced again. Now the
 * first tab claims this lock, and the others wait for it to come back and then reload, restoring from
 * the tokens it saved to the shared cache. A lock older than the TTL belongs to a tab that never came
 * back and is ignored.
 */
const LOCK_KEY = storageKeys.authRedirectLock
// A tab id that survives this tab's own redirect round trip, so the tab that comes back can release
// the lock it took before it left.
const TAB_ID_KEY = sessionStorageKeys.authTabId
export const REDIRECT_LOCK_TTL_MS = 60 * 1000
// Tabs restored together start within milliseconds of each other: a claim is confirmed only once
// no other tab has overwritten it in this time.
export const REDIRECT_LOCK_SETTLE_MS = 100

let fallbackTabId: string | undefined

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function tabId(): string {
  const stored = safeSessionStorage.get(TAB_ID_KEY)
  if (stored) return stored
  const id = newId()
  if (safeSessionStorage.trySet(TAB_ID_KEY, id)) return id
  fallbackTabId ??= id
  return fallbackTabId
}

type RedirectLock = { tab: string; at: number }

function readLock(): RedirectLock | null {
  try {
    const parsed: unknown = JSON.parse(safeStorage.get(LOCK_KEY) ?? "null")
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as RedirectLock).tab === "string" &&
      typeof (parsed as RedirectLock).at === "number"
    ) {
      return parsed as RedirectLock
    }
  } catch {
    // Unreadable: nobody holds it.
  }
  return null
}

function heldByAnotherTab(lock: RedirectLock | null): boolean {
  return (
    lock !== null &&
    lock.tab !== tabId() &&
    Date.now() - lock.at < REDIRECT_LOCK_TTL_MS
  )
}

/** Takes the lock for this tab, or reports that another tab is already redirecting. */
export async function claimRedirectLock(): Promise<boolean> {
  if (heldByAnotherTab(readLock())) return false
  const mine: RedirectLock = { tab: tabId(), at: Date.now() }
  safeStorage.set(LOCK_KEY, JSON.stringify(mine))
  await new Promise((resolve) => setTimeout(resolve, REDIRECT_LOCK_SETTLE_MS))
  // Storage that refuses the write leaves nothing to coordinate with: go ahead.
  return !heldByAnotherTab(readLock())
}

/** Called on the page a redirect returns to, and when a redirect could not start. */
export function releaseRedirectLock() {
  if (readLock()?.tab === tabId()) safeStorage.remove(LOCK_KEY)
}

/** Resolves once the other tab releases the lock or its TTL runs out. */
export function waitForRedirectLock(): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener("storage", onStorage)
      clearInterval(timer)
      resolve()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCK_KEY && event.newValue === null) done()
    }
    window.addEventListener("storage", onStorage)
    const timer = setInterval(() => {
      if (!heldByAnotherTab(readLock())) done()
    }, 1000)
  })
}

/** Reloads the page; separate so tests can observe it. */
export function reloadPage() {
  window.location.reload()
}
