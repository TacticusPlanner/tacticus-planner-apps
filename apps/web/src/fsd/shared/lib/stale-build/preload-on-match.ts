/**
 * A route `loader` that starts downloading a lazy page's chunk as soon as the route matches and
 * returns `null` synchronously, so rendering never waits on it. Without it the chunk is only
 * requested when `React.lazy` first renders, which `OnboardingGate` holds back until `GET /me`
 * resolves (and each nested `lazy()` level adds another round trip). A failed download is left to
 * the `React.lazy` render, which reports it through the route error boundary.
 */
export function preloadOnMatch(load: () => Promise<unknown>) {
  return () => {
    load().catch(() => {})
    return null
  }
}
