import { useEffect, type ReactNode } from "react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { useMatches, type Params } from "react-router"

import { useIsAuthenticated } from "@azure/msal-react"

import { useCurrentUser } from "@/entities/account"
import { AnalyticsProvider, useAnalyticsActions } from "@/shared/analytics"
import { setErrorReporter } from "@/shared/lib"

// The matched route's concrete pathname with each param's value swapped back for its param name
// (e.g. "/library/characters/abc-123" + { entityId: "abc-123" } -> "/library/characters/:entityId")
// - so page_view reports which screen was used without reporting what was looked at. See design.md's
// "Page views report the matched route pattern".
//
// A param's value is replaced as a literal substring, not a single `/`-split segment: react-router's
// catch-all route (routes.tsx's `{ path: "*" }`) reports its unmatched remainder under params["*"] as
// one value that can itself contain "/" (e.g. "foo/bar/baz" for a three-segment miss), so segment-only
// matching would leave a multi-segment splat - and any id-like value inside it - unredacted. Longest
// values are replaced first so a shorter param's value can't partially match inside a longer one.
function toRoutePattern(pathname: string, params: Params): string {
  const definedParams = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  )
  definedParams.sort(([, a], [, b]) => b.length - a.length)

  return definedParams.reduce((pattern, [name, value]) => {
    const placeholder = name === "*" ? "*" : `:${name}`
    return pattern.split(value).join(placeholder)
  }, pathname)
}

// Error text can carry request URLs; their query strings may hold ids or tokens, so they are cut.
function withoutQueryStrings(text: string): string {
  return text.replace(/(https?:\/\/[^\s?#)]+)[?#][^\s)]*/g, "$1")
}

export function PostHogProvider({
  children,
  routeGroup,
}: {
  children: ReactNode
  routeGroup: string | undefined
}) {
  return (
    <AnalyticsProvider>
      <PostHogIdentity routeGroup={routeGroup}>{children}</PostHogIdentity>
    </AnalyticsProvider>
  )
}

function PostHogIdentity({
  children,
  routeGroup,
}: {
  children: ReactNode
  routeGroup: string | undefined
}) {
  const isAuthenticated = useIsAuthenticated()
  const { state } = useCurrentUser()
  const { isReady, identifyUser, clearIdentity, captureEvent } =
    useAnalyticsActions()
  const isMobile = useIsMobile()
  const matches = useMatches()

  // Missing/undefined analyticsId (an unresolved account, an account-load error, or an apps
  // deployed-before-api mismatch) is treated exactly like "not identified" - no crash, no capture.
  const analyticsId =
    state.status === "success" ? state.user.analyticsId : undefined
  const isIdentified = isAuthenticated && Boolean(analyticsId)

  useEffect(() => {
    if (isAuthenticated && analyticsId) {
      identifyUser(analyticsId)
    } else {
      clearIdentity()
    }
  }, [isAuthenticated, analyticsId, identifyUser, clearIdentity])

  // Errors are reported only while identified, tagged with the current nav section.
  useEffect(() => {
    if (!isIdentified) return
    setErrorReporter((error, context) => {
      const asError = error instanceof Error ? error : null
      captureEvent({
        type: "client_error",
        message: withoutQueryStrings(asError?.message ?? String(error)),
        stack: asError?.stack ? withoutQueryStrings(asError.stack) : null,
        context: context ?? null,
        routeGroup: routeGroup ?? "unknown",
        appVersion: import.meta.env.VITE_APP_VERSION ?? null,
      })
    })
    return () => setErrorReporter(null)
  }, [isIdentified, captureEvent, routeGroup])

  const leafMatch = matches.at(-1)
  const routePattern = leafMatch
    ? toRoutePattern(leafMatch.pathname, leafMatch.params)
    : undefined

  useEffect(() => {
    if (!routePattern || !isIdentified || !isReady) {
      return
    }
    captureEvent({
      type: "page_view",
      routePattern,
      routeGroup: routeGroup ?? "unknown",
      viewMode: isMobile ? "mobile" : "desktop",
    })
    // Fires on an actual route-pattern change (specs/product-analytics/spec.md's "Navigation is
    // reported as declared page-view events") and once when the SDK becomes ready after
    // identification, reporting the route the user is on at that moment (the SDK is downloaded
    // only once a user is identified). isIdentified/routeGroup/isMobile/captureEvent are read at
    // the moment the effect runs rather than being trigger dependencies, so signing in/out with the
    // SDK already loaded, a nav-section change, or a viewport resize on the *same* route never
    // fires a spurious extra page_view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePattern, isReady])

  return <>{children}</>
}
