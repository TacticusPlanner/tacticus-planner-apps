import type { CaptureResult, Properties } from "posthog-js"

// The route pattern of the page currently reported (e.g. "/library/characters/:entityId"); set
// with every $pageview and applied to every later event's URL until the next one.
let reportedRoutePattern: string | null = null
// The pattern before the latest one: a $pageview's $prev_pageview_pathname is the page it left.
let previousRoutePattern: string | null = null

export function setReportedRoutePattern(routePattern: string) {
  previousRoutePattern = reportedRoutePattern
  reportedRoutePattern = routePattern
}

/** Test-only: forget the reported route patterns between tests. */
export function resetReportedRoutePattern() {
  reportedRoutePattern = null
  previousRoutePattern = null
}

// Properties holding the page's own URL, which get the route pattern instead of the concrete path.
// Web vitals nest them per metric ($web_vitals_LCP_event.$current_url / .navigationURL).
const pageUrlKeys = new Set(["$current_url", "navigationURL"])

function withoutQueryOrHash(url: string): string {
  return url.replace(/[?#].*$/, "")
}

// Walks nested objects too: the SDK's own features (web vitals) put full URLs below the top level.
function redactUrls(
  properties: Properties | undefined,
  pattern: string | null
) {
  if (!properties) return
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string" && /^https?:\/\//.test(value)) {
      properties[key] =
        pattern && pageUrlKeys.has(key)
          ? new URL(pattern, value).toString()
          : withoutQueryOrHash(value)
    } else if (value && typeof value === "object") {
      redactUrls(value as Properties, pattern)
    }
  }
}

/**
 * `before_send` hook. posthog-js attaches the full browser URL to every event on its own, which
 * would report the ids and query strings the declared events deliberately leave out. Query
 * strings and hashes are cut from every URL-valued property at any depth, and the page's URL and
 * paths are rewritten to the reported route pattern (so Web analytics groups pages by screen).
 */
export function sanitizeCapture(result: CaptureResult): CaptureResult {
  const pattern = reportedRoutePattern
  redactUrls(result.properties, pattern)
  redactUrls(result.$set, null)
  redactUrls(result.$set_once, null)

  const { properties } = result
  if (pattern && typeof properties.$current_url === "string") {
    properties.$pathname = pattern
  }
  if ("$prev_pageview_pathname" in properties) {
    const previous =
      result.event === "$pageview" ? previousRoutePattern : pattern
    if (previous) properties.$prev_pageview_pathname = previous
    else delete properties.$prev_pageview_pathname
  }
  return result
}
