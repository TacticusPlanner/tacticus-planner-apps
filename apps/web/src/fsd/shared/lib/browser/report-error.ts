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

/** Routes every uncaught error and unhandled rejection to `reportError`; installed once at boot. */
export function installGlobalErrorCapture(target: Window = window) {
  target.addEventListener("error", (event) => {
    // A cross-origin script (an extension, a page translator) throwing reaches us as a bare
    // "Script error." with no error object: nothing to diagnose, and not our code (ours is same-origin).
    if (!event.error && event.message === "Script error.") return
    reportError(event.error ?? event.message, "window.error")
  })
  target.addEventListener("unhandledrejection", (event) =>
    reportError(event.reason, "unhandledrejection")
  )
}
