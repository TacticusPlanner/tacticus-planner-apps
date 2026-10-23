import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  legendaryEventPlanQueries,
  type LegendaryEventAnnotation,
  type LegendaryEventPlan,
} from "@/entities/legendary-event"
import { ApiError } from "@/shared/api"

import { useAnnotations } from "./use-annotations"

const api = vi.hoisted(() => ({ write: vi.fn(), capture: vi.fn() }))

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
  updateLegendaryEventAnnotations: api.write,
}))

const EVENT = "astarLysander"

const mark = (
  battleIndex: number,
  objectiveId: number,
  status: LegendaryEventAnnotation["status"]
): LegendaryEventAnnotation => ({
  laneId: "alpha",
  battleIndex,
  objectiveId,
  status,
  updatedAt: "2026-10-10T00:00:00Z",
})

function plan(
  revision: number,
  annotations: LegendaryEventAnnotation[] = []
): LegendaryEventPlan {
  return {
    eventId: EVENT,
    revision,
    catalogVersion: "1",
    notes: null,
    showPaidOptions: false,
    teams: [],
    runs: [],
    annotations,
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
  const hook = renderHook(() => useAnnotations(EVENT), { wrapper })
  const cached = () => queryClient.getQueryData<LegendaryEventPlan>(queryKey)!
  return { ...hook, cached }
}

// Lysander Alpha battle 9: Suppressive Fire (objective index 1, cell 2) cleared, the rest not.
const battle9 = {
  index: 8,
  cleared: [false, false, true, false, false, false],
}

describe("useAnnotations", () => {
  beforeEach(() => {
    for (const mock of Object.values(api)) mock.mockReset()
    vi.mocked(toast).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("marks one cell optimistically with one write", async () => {
    let resolve!: (value: LegendaryEventPlan) => void
    api.write.mockReturnValue(new Promise((done) => (resolve = done)))
    const { result, cached } = setup(plan(2))

    let outcome!: Promise<string>
    act(() => {
      outcome = result.current.markCell("alpha", 6, 3, "stopHere")
    })
    expect(cached().annotations).toEqual([
      expect.objectContaining({
        laneId: "alpha",
        battleIndex: 6,
        objectiveId: 3,
        status: "stopHere",
      }),
    ])
    await act(async () => {
      resolve(plan(3, [mark(6, 3, "stopHere")]))
      await outcome
    })

    expect(api.write).toHaveBeenCalledTimes(1)
    expect(api.write).toHaveBeenCalledWith(EVENT, {
      expectedRevision: 2,
      laneId: "alpha",
      battleIndex: 6,
      objectiveIds: [3],
      status: "stopHere",
    })
    expect(api.capture).toHaveBeenCalledWith({
      type: "legendary_event_annotation_set",
      eventId: EVENT,
      laneId: "alpha",
      battleIndex: 6,
      cellCount: 1,
      status: "stopHere",
      scope: "cell",
    })
  })

  it("marks every not-cleared cell of a battle in one write, leaving cleared cells out", async () => {
    api.write.mockResolvedValue(plan(3))
    const { result } = setup(plan(2))

    await act(async () => {
      await result.current.markBattle("alpha", battle9, "maybeClear")
    })

    expect(api.write).toHaveBeenCalledWith(EVENT, {
      expectedRevision: 2,
      laneId: "alpha",
      battleIndex: 8,
      objectiveIds: [0, 1, 3, 4, 5],
      status: "maybeClear",
    })
    expect(api.capture).toHaveBeenCalledWith(
      expect.objectContaining({ cellCount: 5, scope: "battle" })
    )
  })

  it("clears a battle's marks with a null status, and sends nothing when unchanged", async () => {
    const marked = [0, 1, 3, 4, 5].map((id) => mark(8, id, "maybeClear"))
    api.write.mockResolvedValue(plan(3))
    const { result, cached } = setup(plan(2, marked))

    let skipped!: string
    await act(async () => {
      skipped = await result.current.markBattle("alpha", battle9, "maybeClear")
    })
    expect(skipped).toBe("skipped")
    expect(api.write).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.markBattle("alpha", battle9, null)
    })
    expect(api.write).toHaveBeenCalledWith(
      EVENT,
      expect.objectContaining({ objectiveIds: [0, 1, 3, 4, 5], status: null })
    )
    expect(cached().annotations).toEqual([])
  })

  it("marks a planned token's cells in one write with scope token", async () => {
    api.write.mockResolvedValue(plan(3))
    const { result, cached } = setup(plan(2))

    await act(async () => {
      await result.current.markToken("alpha", 2, [0, 1, 4], "stopHere")
    })

    expect(api.write).toHaveBeenCalledTimes(1)
    expect(api.write).toHaveBeenCalledWith(EVENT, {
      expectedRevision: 2,
      laneId: "alpha",
      battleIndex: 2,
      objectiveIds: [0, 1, 4],
      status: "stopHere",
    })
    expect(api.capture).toHaveBeenCalledWith(
      expect.objectContaining({ cellCount: 3, scope: "token" })
    )
    expect(cached().revision).toBe(3)
  })

  it("adopts the returned plan when a token mark conflicts", async () => {
    const theirs = plan(7, [mark(2, 4, "maybeClear")])
    api.write.mockRejectedValue(
      new ApiError(409, "Stale.", {
        issueCode: "legendaryEventPlanStale",
        current: theirs,
      })
    )
    const { result, cached } = setup(plan(2))

    let outcome!: string
    await act(async () => {
      outcome = await result.current.markToken("alpha", 2, [4], "maybeClear")
    })

    expect(outcome).toBe("conflict")
    expect(cached()).toEqual(theirs)
  })

  it("rolls back a token mark on another error", async () => {
    api.write.mockRejectedValue(new ApiError(500, "Boom."))
    const { result, cached } = setup(plan(2))

    await act(async () => {
      await result.current.markToken("alpha", 2, [0, 1, 4], "stopHere")
    })

    expect(cached().annotations).toEqual([])
    expect(toast.error).toHaveBeenCalledWith("annotations.toasts.error")
  })

  it("adopts the returned plan on a conflict", async () => {
    const theirs = plan(7, [mark(6, 3, "maybeClear")])
    api.write.mockRejectedValue(
      new ApiError(409, "Stale.", {
        issueCode: "legendaryEventPlanStale",
        current: theirs,
      })
    )
    const { result, cached } = setup(plan(2))

    let outcome!: string
    await act(async () => {
      outcome = await result.current.markCell("alpha", 6, 3, "stopHere")
    })

    expect(outcome).toBe("conflict")
    expect(cached()).toEqual(theirs)
    expect(toast).toHaveBeenCalledWith("teams.toasts.reloaded")
  })

  it("rolls back with a translated toast on another error", async () => {
    api.write.mockRejectedValue(new ApiError(500, "Boom."))
    const { result, cached } = setup(plan(2, [mark(6, 3, "maybeClear")]))

    await act(async () => {
      await result.current.markCell("alpha", 6, 3, "stopHere")
    })

    expect(cached().annotations).toEqual([mark(6, 3, "maybeClear")])
    expect(toast.error).toHaveBeenCalledWith("annotations.toasts.error")
  })
})
