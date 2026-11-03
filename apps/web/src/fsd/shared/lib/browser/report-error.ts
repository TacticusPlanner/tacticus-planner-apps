/** Sends an already-logged error to the analytics destination; registered only while identified. */
export type ErrorReporter = (error: unknown, context?: string) => void

let reporter: ErrorReporter | null = null

// The same error object can reach reportError twice (a route boundary reporting while rendering,
// which Strict Mode repeats in dev; an error rethrown to window). It is logged and reported once.
const reported = new WeakSet<object>()

function alreadyReported(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false
  if (reported.has(error)) return true
  reported.add(error)
  return false
}

/** Registers (or clears, with `null`) where errors are reported. The analytics identity owner
 *  registers one while the user is identified, so anonymous errors are only ever logged. */
export function setErrorReporter(next: ErrorReporter | null) {
  reporter = next
}

/**
 * The one sink for errors nothing else handled (spec: client-error-reporting): logged once, then
 * reported when a reporter is registered. Never throws, even when reporting does.
 */
export function reportError(error: unknown, context?: string) {
  if (alreadyReported(error)) return
  console.error(
    context ? `Unhandled error (${context})` : "Unhandled error",
    error
  )
  try {
    reporter?.(error, context)
  } catch {
    // Reporting is best effort; a failing capture must not raise a second error.
  }
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * Whether an uncaught error came from this app's own scripts, which are always files served from
 * this origin. Everything else is something we can neither diagnose nor fix:
 * - a value that is not one of this page's `Error`s (an extension's content script rejecting with
 *   its own realm's error, a bare string);
 * - an error whose stack names none of our script files: a script an extension injects into the
 *   page (its frames point at the page URL itself) or a third-party widget's own file.
 * An error without a stack (Safari omits it on some DOMExceptions) is kept.
 */
function isFromOurScripts(error: unknown, origin: string): boolean {
  // A DOMException is not an Error in every engine, and IndexedDB / fetch failures are ours.
  if (!(error instanceof Error || error instanceof DOMException)) return false
  if (!error.stack) return true
  return new RegExp(
    `${escapeRegExp(origin)}/[^\\s:)]+\\.(?:m?js|tsx?)\\b`
  ).test(error.stack)
}

/**
 * Routes every uncaught error and unhandled rejection from this app's own code to `reportError`;
 * installed once at boot. A `window.error` without an error object is never ours: it is a
 * cross-origin script's bare "Script error." or a browser notice such as "ResizeObserver loop
 * completed with undelivered notifications".
 */
export function installGlobalErrorCapture(target: Window = window) {
  const { origin } = window.location
  target.addEventListener("error", (event) => {
    if (!isFromOurScripts(event.error, origin)) return
    reportError(event.error, "window.error")
  })
  target.addEventListener("unhandledrejection", (event) => {
    if (!isFromOurScripts(event.reason, origin)) return
    reportError(event.reason, "unhandledrejection")
  })
}
