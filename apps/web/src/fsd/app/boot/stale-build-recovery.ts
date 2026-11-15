import { reloadOnceForStaleBuild } from "@/shared/lib"

// The analytics SDK chunk (named by the `posthog` group in vite.config.ts) is optional: a blocker or
// a deleted chunk only means capture stays off, so its failure never costs the user a reload.
function isOptionalChunkError(event: Event): boolean {
  const payload = (event as Event & { payload?: unknown }).payload
  return (
    payload instanceof Error && /\/posthog-[\w-]+\.js/.test(payload.message)
  )
}

// Vite fires `vite:preloadError` twice over for a lazy chunk: once per stylesheet dependency that
// fails to load (before the module itself is imported), and once if the `import()` itself fails.
function isStylesheetPreloadError(event: Event): boolean {
  const payload = (event as Event & { payload?: unknown }).payload
  return (
    payload instanceof Error &&
    payload.message.startsWith("Unable to preload CSS")
  )
}

/**
 * Vite reports a failed chunk download (a chunk deleted by a newer deploy) as `vite:preloadError`.
 * Reload once; if this URL already used its attempt, the failure reaches the route boundary (or the
 * startup catch in main.tsx) as usual.
 *
 * Only a stylesheet failure is suppressed (`preventDefault`): Vite then goes on to import the module,
 * which succeeds or fails on its own. A failed `import()` must never be suppressed: Vite would resolve
 * it with `undefined` instead of rejecting, and the `React.lazy` waiting on it would crash reading
 * `undefined.default` (or Safari's `e._result.default`) before the reload tears the page down. Left
 * to reject, the route boundary recognises the stale-build error and renders nothing while the
 * reload started here is in flight.
 */
export function installPreloadErrorRecovery(target: Window = window) {
  const onPreloadError = (event: Event) => {
    if (isOptionalChunkError(event)) return
    if (reloadOnceForStaleBuild() && isStylesheetPreloadError(event)) {
      event.preventDefault()
    }
  }
  target.addEventListener("vite:preloadError", onPreloadError)
  return () => target.removeEventListener("vite:preloadError", onPreloadError)
}
