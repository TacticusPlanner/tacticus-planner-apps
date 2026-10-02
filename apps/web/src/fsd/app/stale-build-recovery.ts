import { reloadOnceForStaleBuild } from "@/shared/lib"

/**
 * Vite reports a failed modulepreload (a chunk deleted by a newer deploy) as `vite:preloadError`
 * before React has a chance to render anything. Reload once; if this URL already used its attempt,
 * leave the event alone so Vite rethrows and the error reaches the route boundary (or the startup
 * catch in main.tsx).
 */
export function installPreloadErrorRecovery(target: Window = window) {
  const onPreloadError = (event: Event) => {
    if (reloadOnceForStaleBuild()) event.preventDefault()
  }
  target.addEventListener("vite:preloadError", onPreloadError)
  return () => target.removeEventListener("vite:preloadError", onPreloadError)
}
