// CLS and INP are reported once per page load, when the tab is hidden, so posthog-js labels them
// with whatever route is open at that moment. In this single-page app that is often not the page
// where the shift or the slow interaction happened (a shift on a Legendary Event page reported
// under /home). This module keeps a timeline of reported routes and the slowest interactions, so
// each metric can be labelled with the route it was measured on (specs/product-analytics/spec.md).

/** Route changes kept for lookup; older entries are dropped (a session rarely visits this many). */
const MAX_ROUTE_CHANGES = 200
/** Slowest interactions kept; web-vitals keeps the same number to pick INP from. */
const MAX_INTERACTIONS = 10

type RouteChange = { atMs: number; routePattern: string }
type Interaction = { durationMs: number; routePattern: string | null }

let routeChanges: RouteChange[] = []
// Keyed by the browser's interactionId, so the several event entries of one tap count once.
let interactions = new Map<number, Interaction>()
let observer: PerformanceObserver | null = null

/** Records that `routePattern` became the reported route at `atMs` (performance.now() time). */
export function recordRouteChange(
  routePattern: string,
  atMs: number = performance.now()
) {
  routeChanges.push({ atMs, routePattern })
  if (routeChanges.length > MAX_ROUTE_CHANGES) routeChanges.shift()
}

/**
 * The route that was open at `atMs` (performance.now() time). A time before the first reported
 * route belongs to that first route: the first page view is sent only once the SDK has loaded,
 * after the page it reports was already showing.
 */
export function routeAt(atMs: number): string | null {
  let found: string | null = routeChanges[0]?.routePattern ?? null
  for (const change of routeChanges) {
    if (change.atMs > atMs) break
    found = change.routePattern
  }
  return found
}

/** The route of the slowest recorded interaction lasting exactly `durationMs` (INP's value). */
export function routeOfInteraction(durationMs: number): string | null {
  for (const interaction of interactions.values()) {
    if (interaction.durationMs === durationMs) return interaction.routePattern
  }
  return null
}

/** Notes one Event Timing entry: the interaction's longest entry is its latency, as in INP. */
export function recordInteraction(
  interactionId: number,
  durationMs: number,
  startMs: number
) {
  if (!interactionId) return
  const known = interactions.get(interactionId)
  if (known && known.durationMs >= durationMs) return
  interactions.set(interactionId, {
    durationMs,
    routePattern: known?.routePattern ?? routeAt(startMs),
  })
  if (interactions.size > MAX_INTERACTIONS) {
    let fastestId: number | null = null
    let fastest = Infinity
    for (const [id, interaction] of interactions) {
      if (interaction.durationMs < fastest) {
        fastest = interaction.durationMs
        fastestId = id
      }
    }
    if (fastestId !== null) interactions.delete(fastestId)
  }
}

/**
 * Starts watching interactions (Event Timing) so INP can be matched to the page it was measured
 * on. Only timings and the interaction id are read: no target, text or input value. Does nothing
 * where the browser doesn't support Event Timing, or when already started.
 */
export function startInteractionTracking() {
  if (observer || typeof PerformanceObserver === "undefined") return
  if (!PerformanceObserver.supportedEntryTypes?.includes("event")) return
  observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as PerformanceEventTiming[]) {
      recordInteraction(entry.interactionId, entry.duration, entry.startTime)
    }
  })
  // Same threshold INP uses by default; buffered picks up taps made before the SDK loaded.
  // durationThreshold is part of Event Timing but missing from TypeScript's DOM types.
  const options: PerformanceObserverInit & { durationThreshold: number } = {
    type: "event",
    buffered: true,
    durationThreshold: 40,
  }
  observer.observe(options)
}

/** Test-only: forget the timeline and the recorded interactions. */
export function resetWebVitalsRoutes() {
  observer?.disconnect()
  observer = null
  routeChanges = []
  interactions = new Map()
}
