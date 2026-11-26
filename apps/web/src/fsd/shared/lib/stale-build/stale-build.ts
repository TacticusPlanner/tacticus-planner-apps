import { safeSessionStorage, staleReloadKey } from "../browser"

// Recognises failures that mean "this tab is running a build that no longer exists on the server"
// (or that a newer tab has moved the local databases on): a reload fixes all of them, nothing else
// does. Shared by the route error boundary and main.tsx's `vite:preloadError` listener.

// Browser-specific messages for a failed `import()` of a deleted chunk. Vite rethrows the native
// error unchanged, so these are the strings Chromium, WebKit and Firefox actually produce.
const importFailurePatterns = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /dynamically imported module/i,
]

// Dexie closes an older tab's connection when a newer tab upgrades the schema. Matched by name so
// `shared` does not take a Dexie import for this.
const closedDatabaseErrorNames = new Set([
  "DatabaseClosedError",
  "VersionError",
  "InvalidStateError",
])

function unwrap(error: unknown): unknown[] {
  if (typeof error !== "object" || error === null) return [error]
  const record = error as { error?: unknown; cause?: unknown }
  // react-router wraps render errors (`error.error`); fetch/import failures may carry a `cause`.
  return [error, record.error, record.cause].filter((e) => e !== undefined)
}

export function isStaleBuildError(error: unknown): boolean {
  return unwrap(error).some((candidate) => {
    if (typeof candidate !== "object" || candidate === null) return false
    const { name, message } = candidate as { name?: unknown; message?: unknown }
    if (typeof name === "string" && closedDatabaseErrorNames.has(name)) {
      return true
    }
    return (
      typeof message === "string" &&
      importFailurePatterns.some((pattern) => pattern.test(message))
    )
  })
}

// Identifies this document: the session marker stores it, so a caller asking again before the
// browser tears the page down (a remounted boundary, a second failing chunk) is told "a reload is
// in flight", while a marker written by an earlier document means the attempt is used up.
const documentId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

// Set while a sign-in redirect is leaving the page (spec: app-error-recovery). Firefox and WebKit
// abort the page's in-flight module loads as soon as that navigation starts, which reads as a stale
// build; reloading then would cancel the redirect and bring the user straight back without its
// response (auth_step data, Nov 2026: most `no_response` returns on those browsers came back within
// half a second of leaving).
let leavingPage = false

/** Called just before a redirect leaves the page: stale-build failures from here on are the page
 *  being torn down, not a stale build. */
export function markPageLeaving() {
  leavingPage = true
}

/** Called when a redirect could not start after all, so the page stays. */
export function clearPageLeaving() {
  leavingPage = false
}

/**
 * Reloads the current URL once per browser session. Returns true when a reload (or a redirect
 * leaving the page) is in flight, so the caller should render nothing, and false when this URL
 * already used its attempt in an earlier document — or storage is unavailable, so "once" cannot be enforced — in which case the caller
 * shows the fallback error page instead of looping on a build that is broken for everyone.
 */
export function reloadOnceForStaleBuild(): boolean {
  // The navigation already in flight replaces the page: render nothing and keep the attempt.
  if (leavingPage) return true
  const key = staleReloadKey(
    `${window.location.pathname}${window.location.search}`
  )
  const marker = safeSessionStorage.get(key)
  if (marker === documentId) return true
  if (marker) return false
  // Storage that cannot record the attempt (or read it back) cannot stop a loop: no reload.
  if (
    !safeSessionStorage.trySet(key, documentId) ||
    safeSessionStorage.get(key) !== documentId
  ) {
    return false
  }
  window.location.reload()
  return true
}
