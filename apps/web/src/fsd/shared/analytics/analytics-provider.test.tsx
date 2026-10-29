import type { ReactNode } from "react"
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`expected an item at index ${index}`)
  return value
}

const sdk = vi.hoisted(() => {
  const client = {
    identify: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    reset: vi.fn(),
    capture: vi.fn(),
    get_distinct_id: vi.fn(() => "anonymous-id"),
    has_opted_out_capturing: vi.fn(() => true),
  }
  return { client, init: vi.fn(() => client), imported: vi.fn() }
})
vi.mock("posthog-js", () => {
  sdk.imported()
  return { default: { init: sdk.init } }
})
vi.mock("posthog-js/dist/web-vitals", () => ({}))

import { AnalyticsProvider, useAnalyticsActions } from "./analytics-provider"

function wrapper({ children }: { children: ReactNode }) {
  return <AnalyticsProvider>{children}</AnalyticsProvider>
}

// Identifies a user and waits for the SDK to load, then clears the setup calls.
async function renderReady() {
  const hook = renderHook(() => useAnalyticsActions(), { wrapper })
  act(() => hook.result.current.identifyUser("analytics-id"))
  await waitFor(() => expect(hook.result.current.isReady).toBe(true))
  vi.clearAllMocks()
  return hook
}

beforeEach(() => {
  vi.stubEnv("VITE_ANALYTICS_ENABLED", "true")
  vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "test-token")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe("AnalyticsProvider", () => {
  it("downloads no SDK for a visitor who is never identified", async () => {
    render(
      <AnalyticsProvider>
        <span>content</span>
      </AnalyticsProvider>
    )

    expect(screen.getByText("content")).toBeInTheDocument()
    await Promise.resolve()
    expect(sdk.init).not.toHaveBeenCalled()
  })

  it("downloads no SDK when no project token is configured", async () => {
    vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "")
    const { result } = renderHook(() => useAnalyticsActions(), { wrapper })

    act(() => result.current.identifyUser("analytics-id"))
    await Promise.resolve()

    expect(sdk.init).not.toHaveBeenCalled()
    expect(result.current.isReady).toBe(false)
  })

  it("downloads no SDK when analytics is not enabled, even with a project token", async () => {
    vi.stubEnv("VITE_ANALYTICS_ENABLED", "false")
    const { result } = renderHook(() => useAnalyticsActions(), { wrapper })

    act(() => result.current.identifyUser("analytics-id"))
    await Promise.resolve()

    expect(sdk.init).not.toHaveBeenCalled()
    expect(result.current.isReady).toBe(false)
  })

  it("loads the SDK on identification, opted out, with no autocapture, replay, or default pageview capture, then identifies and opts in", async () => {
    // initOptions.api_host is a module-level constant baked in when analytics-provider is first
    // imported, before this stub runs - re-import fresh so this render picks up the stubbed host.
    vi.stubEnv("VITE_POSTHOG_HOST", "https://us.i.posthog.com")
    vi.resetModules()
    const fresh = await import("./analytics-provider")
    const { result } = renderHook(() => fresh.useAnalyticsActions(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <fresh.AnalyticsProvider>{children}</fresh.AnalyticsProvider>
      ),
    })

    act(() => result.current.identifyUser("analytics-id"))
    await waitFor(() => expect(result.current.isReady).toBe(true))

    expect(sdk.init).toHaveBeenCalledExactlyOnceWith(
      "test-token",
      expect.objectContaining({
        api_host: "https://us.i.posthog.com",
        opt_out_capturing_by_default: true,
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
        person_profiles: "identified_only",
        // opt_out_capturing_by_default alone only suppresses event capture - init() still makes
        // its own /flags and remote-config requests. These two keep the browser silent.
        advanced_disable_flags: true,
        disable_external_dependency_loading: true,
        capture_pageleave: true,
        // Web vitals are enabled client-side (remote config is off) and their extension is bundled.
        capture_performance: {
          web_vitals: true,
          web_vitals_attribution: false,
        },
        before_send: expect.any(Function),
      })
    )
    expect(sdk.client.identify).toHaveBeenCalledWith("analytics-id")
    expect(sdk.client.opt_in_capturing).toHaveBeenCalledExactlyOnceWith({
      captureEventName: false,
    })
  })

  it("stays silent and inert when the SDK download is blocked", async () => {
    vi.resetModules()
    vi.doMock("posthog-js", () => {
      throw new Error("blocked by the client")
    })
    const fresh = await import("./analytics-provider")
    const { result } = renderHook(() => fresh.useAnalyticsActions(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <fresh.AnalyticsProvider>{children}</fresh.AnalyticsProvider>
      ),
    })

    act(() => result.current.identifyUser("analytics-id"))
    await new Promise((resolve) => setTimeout(resolve, 0))
    result.current.captureEvent({
      type: "page_view",
      routePattern: "/home",
      routeGroup: "/home",
      viewMode: "desktop",
    })

    expect(result.current.isReady).toBe(false)
    expect(sdk.init).not.toHaveBeenCalled()
    vi.doMock("posthog-js", () => ({ default: { init: sdk.init } }))
  })

  it("discards the SDK when the user signs out before it finished loading", async () => {
    const { result } = renderHook(() => useAnalyticsActions(), { wrapper })

    act(() => {
      result.current.identifyUser("analytics-id")
      result.current.clearIdentity()
    })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(sdk.init).not.toHaveBeenCalled()
    expect(sdk.client.identify).not.toHaveBeenCalled()
    expect(result.current.isReady).toBe(false)
  })
})

describe("useAnalyticsActions", () => {
  it("makes no SDK call for any action before the SDK has loaded", async () => {
    const { result } = renderHook(() => useAnalyticsActions(), { wrapper })

    result.current.clearIdentity()
    result.current.captureEvent({
      type: "page_view",
      routePattern: "/library/characters/:entityId",
      routeGroup: "/library",
      viewMode: "desktop",
    })
    await Promise.resolve()

    expect(sdk.init).not.toHaveBeenCalled()
    expect(sdk.client.capture).not.toHaveBeenCalled()
    expect(sdk.client.reset).not.toHaveBeenCalled()
  })

  it("is inert without a provider", () => {
    const { result } = renderHook(() => useAnalyticsActions())

    result.current.identifyUser("analytics-id")

    expect(result.current.isReady).toBe(false)
    expect(sdk.init).not.toHaveBeenCalled()
  })

  it("re-identifies through the loaded SDK without loading it again", async () => {
    const { result } = await renderReady()

    result.current.identifyUser("analytics-id-2")

    expect(sdk.init).not.toHaveBeenCalled()
    expect(sdk.client.identify).toHaveBeenCalledWith("analytics-id-2")
    expect(sdk.client.opt_in_capturing).toHaveBeenCalledExactlyOnceWith({
      captureEventName: false,
    })
  })

  it("sends nothing when re-identifying the user already identified and opted in", async () => {
    const { result } = await renderReady()
    sdk.client.get_distinct_id.mockReturnValueOnce("analytics-id")
    sdk.client.has_opted_out_capturing.mockReturnValueOnce(false)

    result.current.identifyUser("analytics-id")

    expect(sdk.client.identify).not.toHaveBeenCalled()
    expect(sdk.client.opt_in_capturing).not.toHaveBeenCalled()
  })

  it("opts out before resetting on teardown", async () => {
    const { result } = await renderReady()

    result.current.clearIdentity()

    expect(sdk.client.opt_out_capturing).toHaveBeenCalledTimes(1)
    expect(sdk.client.reset).toHaveBeenCalledTimes(1)
    const optOutOrder = at(
      sdk.client.opt_out_capturing.mock.invocationCallOrder,
      0
    )
    const resetOrder = at(sdk.client.reset.mock.invocationCallOrder, 0)
    expect(optOutOrder).toBeLessThan(resetOrder)
  })

  it("captures a page_view as $pageview with only the declared properties", async () => {
    const { result } = await renderReady()

    result.current.captureEvent({
      type: "page_view",
      routePattern: "/library/characters/:entityId",
      routeGroup: "/library",
      viewMode: "mobile",
    })

    expect(sdk.client.capture).toHaveBeenCalledWith("$pageview", {
      route_pattern: "/library/characters/:entityId",
      route_group: "/library",
      view_mode: "mobile",
    })
  })

  it("captures the Legendary Event team events with only the declared properties", async () => {
    const { result } = await renderReady()

    result.current.captureEvent({
      type: "legendary_event_team_created",
      eventId: "astarLysander",
      laneId: "alpha",
      memberCount: 3,
      objectiveCount: 2,
      source: "suggestion",
      suggestionRank: 1,
    })
    result.current.captureEvent({
      type: "legendary_event_depth_set",
      eventId: "astarLysander",
      laneId: "beta",
      depth: 4,
      estimate: 6,
      fromEstimate: true,
    })
    result.current.captureEvent({
      type: "legendary_event_depth_estimate_restored",
      eventId: "astarLysander",
      laneId: "beta",
      estimate: 6,
    })

    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_team_created",
      {
        event_id: "astarLysander",
        lane_id: "alpha",
        member_count: 3,
        objective_count: 2,
        source: "suggestion",
        suggestion_rank: 1,
      }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_depth_set",
      {
        event_id: "astarLysander",
        lane_id: "beta",
        depth: 4,
        estimate: 6,
        from_estimate: true,
      }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_depth_estimate_restored",
      { event_id: "astarLysander", lane_id: "beta", estimate: 6 }
    )
  })

  it("captures the Legendary Event Stage 6 events with only the declared properties", async () => {
    const { result } = await renderReady()

    result.current.captureEvent({
      type: "legendary_event_goals_preview_toggled",
      eventId: "votanUthar",
      enabled: true,
      surface: "picker",
    })
    result.current.captureEvent({
      type: "legendary_event_create_goal_opened",
      eventId: "votanUthar",
      laneId: null,
      source: "leaderboard",
      goalType: "Unlock",
    })
    result.current.captureEvent({
      type: "legendary_event_upgrade_impact_expanded",
      eventId: "votanUthar",
      laneId: "alpha",
      rowCount: 4,
    })
    result.current.captureEvent({
      type: "legendary_event_team_suggestions_opened",
      eventId: "votanUthar",
      laneId: "alpha",
      suggestionCount: 5,
    })

    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_goals_preview_toggled",
      { event_id: "votanUthar", enabled: true, surface: "picker" }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_create_goal_opened",
      {
        event_id: "votanUthar",
        lane_id: null,
        source: "leaderboard",
        goal_type: "Unlock",
      }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_upgrade_impact_expanded",
      { event_id: "votanUthar", lane_id: "alpha", row_count: 4 }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_team_suggestions_opened",
      { event_id: "votanUthar", lane_id: "alpha", suggestion_count: 5 }
    )
  })

  it("captures the Legendary Event run input, paid options and mark events with only the declared properties", async () => {
    const { result } = await renderReady()

    result.current.captureEvent({
      type: "legendary_event_run_inputs_saved",
      eventId: "votanUthar",
      run: 3,
      regularMissions: 10,
      premiumMissions: 0,
      bundlePurchased: true,
      closeShards: 25,
    })
    result.current.captureEvent({
      type: "legendary_event_paid_options_toggled",
      eventId: "votanUthar",
      on: true,
    })
    result.current.captureEvent({
      type: "legendary_event_plan_created",
      eventId: "votanUthar",
      goals: 4,
      teams: 3,
      ok: true,
    })
    result.current.captureEvent({
      type: "legendary_event_annotation_set",
      eventId: "astarLysander",
      laneId: "alpha",
      battleIndex: 8,
      cellCount: 5,
      status: "maybeClear",
      scope: "battle",
    })

    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_run_inputs_saved",
      {
        event_id: "votanUthar",
        run: 3,
        regular_missions: 10,
        premium_missions: 0,
        bundle_purchased: true,
        close_shards: 25,
      }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_paid_options_toggled",
      { event_id: "votanUthar", on: true }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_plan_created",
      {
        event_id: "votanUthar",
        goals: 4,
        teams: 3,
        ok: true,
      }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_annotation_set",
      {
        event_id: "astarLysander",
        lane_id: "alpha",
        battle_index: 8,
        cell_count: 5,
        status: "maybeClear",
        scope: "battle",
      }
    )
  })

  it("captures the Legendary Event token plan events with only the declared properties", async () => {
    const { result } = await renderReady()

    result.current.captureEvent({
      type: "legendary_event_next_token_shown",
      eventId: "votanUthar",
      state: "token",
      planLength: 6,
      tokensLeftOver: 94,
    })
    result.current.captureEvent({
      type: "legendary_event_token_plan_expanded",
      eventId: "votanUthar",
      planLength: 6,
    })
    result.current.captureEvent({
      type: "legendary_event_run_forecast_expanded",
      eventId: "votanUthar",
    })

    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_next_token_shown",
      {
        event_id: "votanUthar",
        state: "token",
        plan_length: 6,
        tokens_left_over: 94,
      }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_token_plan_expanded",
      { event_id: "votanUthar", plan_length: 6 }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_run_forecast_expanded",
      { event_id: "votanUthar" }
    )
  })

  it("captures the Legendary Event master table, history and tier list events", async () => {
    const { result } = await renderReady()

    result.current.captureEvent({
      type: "legendary_event_master_table_viewed",
      eventCount: 4,
      unitSet: "inTeams",
      pointsMode: "remaining",
    })
    result.current.captureEvent({
      type: "legendary_event_master_table_changed",
      control: "events",
      value: null,
      eventCount: 2,
    })
    result.current.captureEvent({
      type: "legendary_event_last_run_viewed",
      eventId: "votanUthar",
      run: 1,
      teamCount: 2,
      deltaCount: 2,
    })
    result.current.captureEvent({
      type: "legendary_event_earlier_runs_expanded",
      eventId: "tauFarsight",
      recordCount: 2,
    })
    result.current.captureEvent({ type: "legendary_event_tier_list_viewed" })
    result.current.captureEvent({
      type: "legendary_event_tier_list_unit_opened",
      unitId: "custoBladeChampion",
      tier: "S",
    })

    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_master_table_viewed",
      {
        event_count: 4,
        unit_set: "inTeams",
        points_mode: "remaining",
      }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_master_table_changed",
      { control: "events", value: null, event_count: 2 }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_last_run_viewed",
      {
        event_id: "votanUthar",
        run: 1,
        team_count: 2,
        delta_count: 2,
      }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_earlier_runs_expanded",
      { event_id: "tauFarsight", record_count: 2 }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_tier_list_viewed",
      {}
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "legendary_event_tier_list_unit_opened",
      { unit_id: "custoBladeChampion", tier: "S" }
    )
  })

  it("captures the app install events", async () => {
    const { result } = await renderReady()

    result.current.captureEvent({
      type: "app_install_guide_opened",
      source: "homeCard",
      platform: "ios",
      canPrompt: false,
    })
    result.current.captureEvent({
      type: "app_install_prompt_answered",
      source: "accountMenu",
      outcome: "accepted",
    })
    result.current.captureEvent({
      type: "app_install_card_dismissed",
      platform: "android",
    })

    expect(sdk.client.capture).toHaveBeenCalledWith(
      "app_install_guide_opened",
      { source: "homeCard", platform: "ios", can_prompt: false }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "app_install_prompt_answered",
      { source: "accountMenu", outcome: "accepted" }
    )
    expect(sdk.client.capture).toHaveBeenCalledWith(
      "app_install_card_dismissed",
      { platform: "android" }
    )
  })
})
