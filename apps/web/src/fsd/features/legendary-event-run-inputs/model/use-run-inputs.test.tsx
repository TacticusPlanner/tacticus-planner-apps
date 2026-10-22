import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  legendaryEventPlanQueries,
  type LegendaryEventPlan,
  type LegendaryEventRunInputs,
} from "@/entities/legendary-event"
import { ApiError } from "@/shared/api"

import { RUN_INPUTS_SETTLE_MS, useRunInputs } from "./use-run-inputs"

const api = vi.hoisted(() => ({
  runs: vi.fn(),
  plan: vi.fn(),
  capture: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}))
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: api.capture }),
}))
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  updateLegendaryEventRunInputs: api.runs,
  updateLegendaryEventPlan: api.plan,
}))

const EVENT = "votanUthar"

const stored = (
  run: 1 | 2 | 3,
  fields: Partial<LegendaryEventRunInputs> = {}
): LegendaryEventRunInputs => ({
  run,
  regularMissions: 0,
  premiumMissions: 0,
  bundlePurchased: false,
  closeShards: 0,
  updatedAt: "2026-10-10T00:00:00Z",
  ...fields,
})

function plan(
  revision: number,
  runs: LegendaryEventRunInputs[] = [],
  fields: Partial<LegendaryEventPlan> = {}
): LegendaryEventPlan {
  return {
    eventId: EVENT,
    revision,
    catalogVersion: "1",
    notes: "Alpha first",
    showPaidOptions: true,
    teams: [],
    runs,
    annotations: [],
    ...fields,
  }
}

function setup(initial: LegendaryEventPlan) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const queryKey = legendaryEventPlanQueries.detail(EVENT).queryKey
  queryClient.setQueryData(queryKey, initial)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useRunInputs(EVENT), { wrapper })
  const cached = () => queryClient.getQueryData<LegendaryEventPlan>(queryKey)!
  return { ...hook, cached }
}

/** Lets the settle timer fire and the queued write resolve. */
async function settle() {
  await act(async () => {
    vi.advanceTimersByTime(RUN_INPUTS_SETTLE_MS)
  })
  await act(async () => {})
}

describe("useRunInputs", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    for (const mock of Object.values(api)) mock.mockReset()
    vi.mocked(toast).mockReset()
    vi.mocked(toast.error).mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it("shows each change at once and saves the run once its changes settle", async () => {
    const saved = plan(4, [stored(3, { regularMissions: 10 })])
    api.runs.mockResolvedValue(saved)
    const { result, cached } = setup(plan(3))

    for (let press = 1; press <= 10; press++) {
      act(() => {
        result.current.change(3, {
          regularMissions: result.current.values(3).regularMissions + 1,
        })
      })
      expect(result.current.values(3).regularMissions).toBe(press)
      act(() => {
        vi.advanceTimersByTime(100)
      })
    }
    expect(api.runs).not.toHaveBeenCalled()

    await settle()

    expect(api.runs).toHaveBeenCalledTimes(1)
    expect(api.runs).toHaveBeenCalledWith(EVENT, 3, {
      expectedRevision: 3,
      regularMissions: 10,
      premiumMissions: 0,
      bundlePurchased: false,
      closeShards: 0,
      completedRegularMissions: [],
      completedPremiumMissions: [],
    })
    expect(cached()).toEqual(saved)
    expect(result.current.values(3).regularMissions).toBe(10)
    expect(api.capture).toHaveBeenCalledWith({
      type: "legendary_event_run_inputs_saved",
      eventId: EVENT,
      run: 3,
      regularMissions: 10,
      premiumMissions: 0,
      bundlePurchased: false,
      closeShards: 0,
    })
  })

  it("sends nothing when the settled values equal the stored ones", async () => {
    const { result } = setup(plan(3, [stored(2, { regularMissions: 6 })]))

    act(() => result.current.change(2, { regularMissions: 7 }))
    act(() => result.current.change(2, { regularMissions: 6 }))
    await settle()

    expect(api.runs).not.toHaveBeenCalled()
    expect(result.current.values(2).regularMissions).toBe(6)
  })

  it("adopts the other device's values on a conflict", async () => {
    const theirs = plan(5, [stored(2, { regularMissions: 8 })])
    api.runs.mockRejectedValue(
      new ApiError(409, "Stale.", {
        issueCode: "legendaryEventPlanStale",
        current: theirs,
      })
    )
    const { result, cached } = setup(plan(3))

    act(() => result.current.change(2, { regularMissions: 6 }))
    await settle()

    expect(cached()).toEqual(theirs)
    expect(result.current.values(2).regularMissions).toBe(8)
    expect(toast).toHaveBeenCalledWith("teams.toasts.reloaded")
    expect(api.capture).not.toHaveBeenCalled()
  })

  it("restores the stored values with a translated toast on another error", async () => {
    api.runs.mockRejectedValue(new ApiError(500, "Boom."))
    const { result } = setup(plan(3, [stored(1, { regularMissions: 4 })]))

    act(() => result.current.change(1, { regularMissions: 9 }))
    await settle()

    expect(result.current.values(1).regularMissions).toBe(4)
    expect(toast.error).toHaveBeenCalledWith("runInputs.toasts.error")
  })

  it("keeps paid values when Show paid options is turned off and on, with the notes unchanged", async () => {
    const initial = plan(3, [stored(2, { premiumMissions: 10 })])
    api.plan
      .mockResolvedValueOnce({
        ...initial,
        revision: 4,
        showPaidOptions: false,
      })
      .mockResolvedValueOnce({ ...initial, revision: 5, showPaidOptions: true })
    const { result } = setup(initial)

    await act(async () => {
      await result.current.setShowPaidOptions(false)
    })
    expect(result.current.showPaidOptions).toBe(false)
    expect(api.plan).toHaveBeenLastCalledWith(EVENT, {
      expectedRevision: 3,
      notes: "Alpha first",
      showPaidOptions: false,
    })
    await act(async () => {
      await result.current.setShowPaidOptions(true)
    })

    expect(api.plan).toHaveBeenLastCalledWith(EVENT, {
      expectedRevision: 4,
      notes: "Alpha first",
      showPaidOptions: true,
    })
    expect(result.current.showPaidOptions).toBe(true)
    expect(result.current.values(2).premiumMissions).toBe(10)
    expect(api.runs).not.toHaveBeenCalled()
    expect(api.capture).toHaveBeenCalledWith({
      type: "legendary_event_paid_options_toggled",
      eventId: EVENT,
      on: true,
    })
  })

  it("saves a settling run at once when the drawer unmounts", async () => {
    api.runs.mockResolvedValue(plan(4, [stored(3, { closeShards: 25 })]))
    const { result, unmount } = setup(plan(3))

    act(() => result.current.change(3, { closeShards: 25 }))
    unmount()
    await act(async () => {})

    expect(api.runs).toHaveBeenCalledWith(
      EVENT,
      3,
      expect.objectContaining({ closeShards: 25 })
    )
  })
})
