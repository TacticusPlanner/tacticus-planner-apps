/** Sends an already-logged error to the analytics destination; registered only while identified. */
export type ErrorReporter = (error: unknown, context?: string) => void

let reporter: ErrorReporter | null = null

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
  target.addEventListener("error", (event) =>
    reportError(event.error ?? event.message, "window.error")
  )
  target.addEventListener("unhandledrejection", (event) =>
    reportError(event.reason, "unhandledrejection")
  )
}
