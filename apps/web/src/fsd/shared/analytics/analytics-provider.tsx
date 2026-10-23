/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { PostHog, PostHogConfig } from "posthog-js"

import type { AnalyticsEvent } from "./analytics-event"
import { sanitizeCapture, setReportedRoutePattern } from "./capture-sanitizer"

// Read fresh (not cached at module scope) so tests can flip VITE_POSTHOG_PROJECT_TOKEN with
// vi.stubEnv without needing vi.resetModules() + a dynamic re-import.
function projectToken(): string | undefined {
  return import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || undefined
}

// Identified users only, no autocapture, no replay, no default pageview - every capture path in
// this module opts in explicitly. See specs/product-analytics/spec.md. Page views are sent as
// PostHog's own $pageview (with $pageleave on) so the built-in Web analytics dashboard works.
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
  defaults: "2026-08-30",
  opt_out_capturing_by_default: true,
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: true,
  disable_session_recording: true,
  person_profiles: "identified_only",
  advanced_disable_flags: true,
  disable_external_dependency_loading: true,
  before_send: sanitizeCapture,
}

// No $opt_in event: opting in is an identity-lifecycle detail, not product usage.
const optInOptions = { captureEventName: false } as const

type AnalyticsContextValue = {
  /** The vendor client, or null until the SDK has loaded for an identified user. */
  client: PostHog | null
  identifyUser: (analyticsId: string) => void
  clearIdentity: () => void
}

// Without a provider (and before identification) every action is inert.
const inert: AnalyticsContextValue = {
  client: null,
  identifyUser: () => {},
  clearIdentity: () => {},
}
const AnalyticsContext = createContext<AnalyticsContextValue>(inert)

/**
 * Owns the vendor SDK. Nothing is downloaded until `identifyUser` is first called with a project
 * token configured: only then is `posthog-js` imported (its own chunk), initialised and the user
 * identified, so a signed-out visitor never downloads analytics code
 * (specs/product-analytics/spec.md). A blocked or failed download leaves capture off, silently.
 * Signing out while it downloads discards the loaded SDK: nothing is initialised for that user.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<PostHog | null>(null)
  // The id to identify once the SDK resolves; null after sign-out, which cancels a pending load.
  const pendingId = useRef<string | null>(null)
  const loading = useRef(false)

  const identifyUser = useCallback(
    (analyticsId: string) => {
      const token = projectToken()
      if (!token) return
      pendingId.current = analyticsId
      if (client) {
        // Re-running for the user already identified and opted in (e.g. the identity effect
        // re-firing once the SDK has loaded) would only send a redundant $identify.
        if (
          client.get_distinct_id() === analyticsId &&
          !client.has_opted_out_capturing()
        ) {
          return
        }
        client.identify(analyticsId)
        client.opt_in_capturing(optInOptions)
        return
      }
      if (loading.current) return
      loading.current = true
      import("posthog-js")
        .then(({ default: posthog }) => {
          const id = pendingId.current
          if (!id) return
          const instance = posthog.init(token, initOptions)
          instance.identify(id)
          instance.opt_in_capturing(optInOptions)
          setClient(instance)
        })
        // Blocked or failed download: capture stays off and the app carries on, silently.
        .catch(() => {})
        .finally(() => {
          loading.current = false
        })
    },
    [client]
  )

  const clearIdentity = useCallback(() => {
    pendingId.current = null
    if (!client) return
    // Opt out *before* reset(): reset() assigns a fresh anonymous id, and opting out afterwards
    // would leave a window in which that fresh anonymous identity could be captured - exactly the
    // anonymous capture the spec forbids.
    client.opt_out_capturing()
    client.reset()
  }, [client])

  const value = useMemo(
    () => ({ client, identifyUser, clearIdentity }),
    [client, identifyUser, clearIdentity]
  )

  return <AnalyticsContext value={value}>{children}</AnalyticsContext>
}

/**
 * The narrow set of analytics actions the rest of the app may perform - identity lifecycle plus
 * declared-event capture. No caller outside this file ever touches the vendor client directly.
 * `isReady` turns true once the SDK has loaded for an identified user.
 */
export function useAnalyticsActions() {
  const { client, identifyUser, clearIdentity } = useContext(AnalyticsContext)

  const captureEvent = useCallback(
    (event: AnalyticsEvent) => {
      // Nothing is captured before the SDK has loaded for an identified user.
      if (!client) {
        return
      }
      switch (event.type) {
        case "page_view":
          setReportedRoutePattern(event.routePattern)
          client.capture("$pageview", {
            route_pattern: event.routePattern,
            route_group: event.routeGroup,
            view_mode: event.viewMode,
          })
          break
        case "legendary_event_team_created":
          client.capture(event.type, {
            event_id: event.eventId,
            lane_id: event.laneId,
            member_count: event.memberCount,
            objective_count: event.objectiveCount,
            source: event.source,
            suggestion_rank: event.suggestionRank,
          })
          break
        case "legendary_event_team_edited":
        case "legendary_event_team_deleted":
          client.capture(event.type, {
            event_id: event.eventId,
            lane_id: event.laneId,
            member_count: event.memberCount,
            objective_count: event.objectiveCount,
          })
          break
        case "legendary_event_depth_set":
          client.capture(event.type, {
            event_id: event.eventId,
            lane_id: event.laneId,
            depth: event.depth,
            estimate: event.estimate,
            from_estimate: event.fromEstimate,
          })
          break
        case "legendary_event_depth_estimate_restored":
          client.capture(event.type, {
            event_id: event.eventId,
            lane_id: event.laneId,
            estimate: event.estimate,
          })
          break
        case "legendary_event_run_inputs_saved":
          client.capture(event.type, {
            event_id: event.eventId,
            run: event.run,
            regular_missions: event.regularMissions,
            premium_missions: event.premiumMissions,
            bundle_purchased: event.bundlePurchased,
            close_shards: event.closeShards,
          })
          break
        case "legendary_event_paid_options_toggled":
          client.capture(event.type, { event_id: event.eventId, on: event.on })
          break
        case "legendary_event_plan_wizard_opened":
          client.capture(event.type, {
            event_id: event.eventId,
            source: event.source,
          })
          break
        case "legendary_event_plan_target_chosen":
          client.capture(event.type, {
            event_id: event.eventId,
            step: event.step,
            verdict: event.verdict,
          })
          break
        case "legendary_event_plan_created":
          client.capture(event.type, {
            event_id: event.eventId,
            goals: event.goals,
            teams: event.teams,
            ok: event.ok,
          })
          break
        case "legendary_event_annotation_set":
          client.capture(event.type, {
            event_id: event.eventId,
            lane_id: event.laneId,
            battle_index: event.battleIndex,
            cell_count: event.cellCount,
            status: event.status,
            scope: event.scope,
          })
          break
        case "legendary_event_goals_preview_toggled":
          client.capture(event.type, {
            event_id: event.eventId,
            enabled: event.enabled,
            surface: event.surface,
          })
          break
        case "legendary_event_create_goal_opened":
          client.capture(event.type, {
            event_id: event.eventId,
            lane_id: event.laneId,
            source: event.source,
            goal_type: event.goalType,
          })
          break
        case "legendary_event_upgrade_impact_expanded":
          client.capture(event.type, {
            event_id: event.eventId,
            lane_id: event.laneId,
            row_count: event.rowCount,
          })
          break
        case "legendary_event_team_suggestions_opened":
          client.capture(event.type, {
            event_id: event.eventId,
            lane_id: event.laneId,
            suggestion_count: event.suggestionCount,
          })
          break
        case "legendary_event_next_token_shown":
          client.capture(event.type, {
            event_id: event.eventId,
            state: event.state,
            plan_length: event.planLength,
            tokens_left_over: event.tokensLeftOver,
          })
          break
        case "legendary_event_token_plan_expanded":
          client.capture(event.type, {
            event_id: event.eventId,
            plan_length: event.planLength,
          })
          break
        case "legendary_event_run_forecast_expanded":
          client.capture(event.type, { event_id: event.eventId })
          break
        case "legendary_event_master_table_viewed":
          client.capture(event.type, {
            event_count: event.eventCount,
            unit_set: event.unitSet,
            points_mode: event.pointsMode,
          })
          break
        case "legendary_event_master_table_changed":
          client.capture(event.type, {
            control: event.control,
            value: event.value,
            event_count: event.eventCount,
          })
          break
        case "legendary_event_last_run_viewed":
          client.capture(event.type, {
            event_id: event.eventId,
            run: event.run,
            team_count: event.teamCount,
            delta_count: event.deltaCount,
          })
          break
        case "legendary_event_earlier_runs_expanded":
          client.capture(event.type, {
            event_id: event.eventId,
            record_count: event.recordCount,
          })
          break
        case "legendary_event_tier_list_viewed":
          client.capture(event.type, {})
          break
        case "legendary_event_tier_list_unit_opened":
          client.capture(event.type, {
            unit_id: event.unitId,
            tier: event.tier,
          })
          break
        case "client_error":
          client.capture(event.type, {
            message: event.message,
            stack: event.stack,
            context: event.context,
            route_group: event.routeGroup,
            app_version: event.appVersion,
          })
          break
      }
    },
    [client]
  )

  return {
    isReady: client !== null,
    identifyUser,
    clearIdentity,
    captureEvent,
  }
}
