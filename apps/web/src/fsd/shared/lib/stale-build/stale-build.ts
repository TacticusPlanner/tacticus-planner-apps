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

const sessionKeyPrefix = "tp:stale-reload:"

function unwrap(error: unknown): unknown[] {
  if (!error || typeof error !== "object") return [error]
  const record = error as { error?: unknown; cause?: unknown }
  // react-router wraps render errors (`error.error`); fetch/import failures may carry a `cause`.
  return [error, record.error, record.cause].filter((e) => e !== undefined)
}

export function isStaleBuildError(error: unknown): boolean {
  return unwrap(error).some((candidate) => {
    if (!candidate || typeof candidate !== "object") return false
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

/**
 * Reloads the current URL once per browser session. Returns true when a reload is in flight (the
 * caller should render nothing) and false when this URL already used its attempt in an earlier
 * document — or storage is unavailable, so "once" cannot be enforced — in which case the caller
 * shows the fallback error page instead of looping on a build that is broken for everyone.
 */
export function reloadOnceForStaleBuild(): boolean {
  const key = `${sessionKeyPrefix}${window.location.pathname}${window.location.search}`
  try {
    const marker = window.sessionStorage.getItem(key)
    if (marker === documentId) return true
    if (marker) return false
    window.sessionStorage.setItem(key, documentId)
  } catch {
    return false
  }
  window.location.reload()
  return true
}
