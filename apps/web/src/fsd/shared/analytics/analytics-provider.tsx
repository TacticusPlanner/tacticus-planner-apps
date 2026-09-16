/* eslint-disable react-refresh/only-export-components */
import { useCallback, type ReactNode } from "react"
import { PostHogProvider as VendorProvider, usePostHog } from "@posthog/react"
import type { PostHogConfig } from "posthog-js"

import type { AnalyticsEvent } from "./analytics-event"

// Read fresh (not cached at module scope) so tests can flip VITE_POSTHOG_PROJECT_TOKEN with
// vi.stubEnv without needing vi.resetModules() + a dynamic re-import.
function isAnalyticsConfigured(): boolean {
  return Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN)
}

// Identified users only, no autocapture, no replay, no default pageview - every capture path in
// this module opts in explicitly. See specs/product-analytics/spec.md.
//
// opt_out_capturing_by_default only suppresses event capture - the SDK's init() still makes its
// own /flags and remote-config requests regardless of opt-out state, which is real anonymous
// network traffic the "no anonymous visitor is ever captured" requirement forbids. This app
// declares no feature flags, surveys, web experiments, or site apps (design.md's Non-Goals), so
// advanced_disable_flags/disable_external_dependency_loading turn those requests off entirely
// rather than merely suppressing what they'd send. Verified against a live PostHog project:
// capture()/identify() still queue and flush normally with flags disabled - only flag-dependent
// features (surveys, server-toggled web vitals, etc.) are affected.
const initOptions: Partial<PostHogConfig> = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  opt_out_capturing_by_default: true,
  autocapture: false,
  capture_pageview: false,
  disable_session_recording: true,
  person_profiles: "identified_only",
  advanced_disable_flags: true,
  disable_external_dependency_loading: true,
}

/**
 * Mounts the vendor SDK, or does nothing at all when no project token is configured - the
 * supported way to run with capture switched off (local dev without a token, the test
 * environment). This is the only place `@posthog/react`'s `PostHogProvider` is used; every other
 * file goes through `useAnalyticsActions` below.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN

  if (!projectToken) {
    return <>{children}</>
  }

  return (
    <VendorProvider apiKey={projectToken} options={initOptions}>
      {children}
    </VendorProvider>
  )
}

/**
 * The narrow set of analytics actions the rest of the app may perform - identity lifecycle plus
 * declared-event capture. No caller outside this file ever touches the vendor client directly.
 */
export function useAnalyticsActions() {
  const client = usePostHog()

  const identifyUser = useCallback(
    (analyticsId: string) => {
      if (!isAnalyticsConfigured()) {
        return
      }
      client.identify(analyticsId)
      client.opt_in_capturing()
    },
    [client]
  )

  const clearIdentity = useCallback(() => {
    if (!isAnalyticsConfigured()) {
      return
    }
    // Opt out *before* reset(): reset() assigns a fresh anonymous id, and opting out afterwards
    // would leave a window in which that fresh anonymous identity could be captured - exactly the
    // anonymous capture the spec forbids.
    client.opt_out_capturing()
    client.reset()
  }, [client])

  const captureEvent = useCallback(
    (event: AnalyticsEvent) => {
      if (!isAnalyticsConfigured()) {
        return
      }
      switch (event.type) {
        case "page_view":
          client.capture("page_view", {
            route_pattern: event.routePattern,
            route_group: event.routeGroup,
            view_mode: event.viewMode,
          })
          break
      }
    },
    [client]
  )

  return { identifyUser, clearIdentity, captureEvent }
}
