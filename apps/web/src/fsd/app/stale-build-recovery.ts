import { reloadOnceForStaleBuild } from "@/shared/lib"

// The analytics SDK chunk (named by the `posthog` group in vite.config.ts) is optional: a blocker or
// a deleted chunk only means capture stays off, so its failure never costs the user a reload.
function isOptionalChunkError(event: Event): boolean {
  const payload = (event as Event & { payload?: unknown }).payload
  return (
    payload instanceof Error && /\/posthog-[\w-]+\.js/.test(payload.message)
  )
}

/**
 * Vite reports a failed modulepreload (a chunk deleted by a newer deploy) as `vite:preloadError`
 * before React has a chance to render anything. Reload once; if this URL already used its attempt,
 * leave the event alone so Vite rethrows and the error reaches the route boundary (or the startup
 * catch in main.tsx).
 */
export function installPreloadErrorRecovery(target: Window = window) {
  const onPreloadError = (event: Event) => {
    if (isOptionalChunkError(event)) return
    if (reloadOnceForStaleBuild()) event.preventDefault()
  }
  target.addEventListener("vite:preloadError", onPreloadError)
  return () => target.removeEventListener("vite:preloadError", onPreloadError)
}
