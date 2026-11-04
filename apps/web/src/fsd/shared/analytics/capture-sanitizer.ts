import type { CaptureResult, Properties } from "posthog-js"

// The route pattern of the page currently reported (e.g. "/library/characters/:entityId"); set
// with every $pageview and applied to every later event's URL until the next one.
let reportedRoutePattern: string | null = null
// The pattern before the latest one: a $pageview's $prev_pageview_pathname is the page it left.
let previousRoutePattern: string | null = null
// The pattern of every concrete path reported this page load. Web vitals are sent up to 5 s after
// they are measured, often after the user has moved on, so their URLs are matched to the pattern
// of their own path rather than the current one. One short entry per path visited.
const patternByPath = new Map<string, string>()

export function setReportedRoutePattern(
  routePattern: string,
  pathname?: string
) {
  previousRoutePattern = reportedRoutePattern
  reportedRoutePattern = routePattern
  if (pathname) patternByPath.set(pathname, routePattern)
}

/** Test-only: forget the reported route patterns between tests. */
export function resetReportedRoutePattern() {
  reportedRoutePattern = null
  previousRoutePattern = null
  patternByPath.clear()
}

// The route pattern for a page URL: its own path's pattern when that path was reported, otherwise
// the current one.
function patternFor(url: string): string | null {
  if (!URL.canParse(url)) return reportedRoutePattern
  return patternByPath.get(new URL(url).pathname) ?? reportedRoutePattern
}

// Properties holding the page's own URL, which get the route pattern instead of the concrete path.
// Web vitals nest them per metric ($web_vitals_LCP_event.$current_url / .navigationURL).
const pageUrlKeys = new Set(["$current_url", "navigationURL"])

function withoutQueryOrHash(url: string): string {
  return url.replace(/[?#].*$/, "")
}

// Walks nested objects too: the SDK's own features (web vitals) put full URLs below the top level.
function redactUrls(properties: Properties | undefined, usePatterns: boolean) {
  if (!properties) return
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string" && /^https?:\/\//.test(value)) {
      const pattern =
        usePatterns && pageUrlKeys.has(key) ? patternFor(value) : null
      properties[key] = pattern
        ? new URL(pattern, value).toString()
        : withoutQueryOrHash(value)
    } else if (value && typeof value === "object") {
      redactUrls(value as Properties, usePatterns)
    }
  }
}

/**
 * `before_send` hook. posthog-js attaches the full browser URL to every event on its own, which
 * would report the ids and query strings the declared events deliberately leave out. Query
 * strings and hashes are cut from every URL-valued property at any depth, and the page's URL and
 * paths are rewritten to the route pattern of that page (so Web analytics groups pages by screen).
 * Every event is also tagged with the build that sent it (`app_version`). This is done here rather
 * than with `register()`, because `reset()` on sign-out clears registered properties.
 */
export function sanitizeCapture(result: CaptureResult): CaptureResult {
  const { properties } = result
  const appVersion = import.meta.env.VITE_APP_VERSION
  if (appVersion) properties.app_version = appVersion
  const pattern = reportedRoutePattern
  const pagePattern =
    typeof properties.$current_url === "string"
      ? patternFor(properties.$current_url)
      : null
  redactUrls(properties, true)
  redactUrls(result.$set, false)
  redactUrls(result.$set_once, false)

  if (pagePattern) properties.$pathname = pagePattern
  if ("$prev_pageview_pathname" in properties) {
    const previous =
      result.event === "$pageview" ? previousRoutePattern : pattern
    if (previous) properties.$prev_pageview_pathname = previous
    else delete properties.$prev_pageview_pathname
  }
  return result
}
