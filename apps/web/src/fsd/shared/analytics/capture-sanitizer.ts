import type { CaptureResult, Properties } from "posthog-js"

// The route pattern of the page currently reported (e.g. "/library/characters/:entityId"); set
// with every $pageview and applied to every later event's URL until the next one.
let reportedRoutePattern: string | null = null

export function setReportedRoutePattern(routePattern: string) {
  reportedRoutePattern = routePattern
}

/** Test-only: forget the reported route pattern between tests. */
export function resetReportedRoutePattern() {
  reportedRoutePattern = null
}

function withoutQueryOrHash(url: string): string {
  return url.replace(/[?#].*$/, "")
}

function stripUrlQueries(properties: Properties | undefined) {
  if (!properties) return
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string" && /^https?:\/\//.test(value)) {
      properties[key] = withoutQueryOrHash(value)
    }
  }
}

/**
 * `before_send` hook. posthog-js attaches the full browser URL to every event on its own, which
 * would report the ids and query strings the declared events deliberately leave out. Query
 * strings and hashes are cut from every URL-valued property, and the current URL/path are
 * rewritten to the reported route pattern (so Web analytics groups pages by screen).
 */
export function sanitizeCapture(result: CaptureResult): CaptureResult {
  stripUrlQueries(result.properties)
  stripUrlQueries(result.$set)
  stripUrlQueries(result.$set_once)

  const pattern = reportedRoutePattern
  const currentUrl: unknown = result.properties.$current_url
  if (pattern && typeof currentUrl === "string") {
    result.properties.$current_url = new URL(pattern, currentUrl).toString()
    result.properties.$pathname = pattern
  }
  return result
}
