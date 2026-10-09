import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  legendaryEventPlanQueries,
  type LegendaryEventPlan,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import { ApiError } from "@/shared/api"

import type { TeamDraft } from "./plan-patches"
import { useLegendaryEventPlan } from "./use-legendary-event-plan"

const api = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  order: vi.fn(),
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
  getLegendaryEventPlan: api.get,
  createLegendaryEventTeam: api.create,
  updateLegendaryEventTeam: api.update,
  deleteLegendaryEventTeam: api.remove,
  updateLegendaryEventTeamOrder: api.order,
}))

const EVENT = "astarLysander"

function team(id: string, sortOrder: number): LegendaryEventTeam {
  return {
    id,
    laneId: "alpha",
    name: `Team ${id}`,
    sortOrder,
    memberUnitIds: ["u1", "u2"],
    reserveUnitId: null,
    objectiveIndexes: [0],
    runDepths: [
      {
        run: 1,
        expectedBattleClears: 7,
        expectedBattleClearsSource: "manual",
        recordedAt: "2026-10-01T00:00:00Z",
      },
    ],
  }
}

function plan(
  revision: number,
  teams: LegendaryEventTeam[]
): LegendaryEventPlan {
  return {
    eventId: EVENT,
    revision,
    catalogVersion: "1",
    notes: null,
    showPaidOptions: false,
    teams,
  }
}

const draft: TeamDraft = {
  name: "Melee",
  memberUnitIds: ["u1", "u2", "u3"],
  reserveUnitId: null,
  objectiveIndexes: [1, 0],
  expectedBattleClears: 4,
}

const conflict = (issueCode: string, current: LegendaryEventPlan) =>
  new ApiError(409, "Stale.", { issueCode, message: "Stale.", plan: current })

function setup(initial: LegendaryEventPlan, run: 1 | 2 | 3 = 1) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(
    legendaryEventPlanQueries.detail(EVENT).queryKey,
    initial
  )
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    () => useLegendaryEventPlan({ eventId: EVENT, run }),
    {
      wrapper,
    }
  )
  const cached = () =>
    queryClient.getQueryData<LegendaryEventPlan>(
      legendaryEventPlanQueries.detail(EVENT).queryKey
    )!
  return { ...hook, cached, queryClient }
}

const order = (current: LegendaryEventPlan) =>
  current.teams.map((entry) => entry.id)

describe("useLegendaryEventPlan", () => {
  beforeEach(() => {
    for (const mock of Object.values(api)) mock.mockReset()
    vi.mocked(toast).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("creates a team with the cached revision and the run, then adopts the returned plan", async () => {
    const saved = plan(3, [team("a", 0), team("new", 1)])
    api.create.mockResolvedValue(saved)
    const { result, cached } = setup(plan(2, [team("a", 0)]), 2)

    let outcome!: string
    await act(async () => {
      outcome = await result.current.createTeam("alpha", draft)
    })

    expect(outcome).toBe("saved")
    expect(api.create).toHaveBeenCalledWith(EVENT, {
      expectedRevision: 2,
      laneId: "alpha",
      name: "Melee",
      memberUnitIds: ["u1", "u2", "u3"],
      reserveUnitId: null,
      objectiveIndexes: [0, 1],
      run: 2,
      expectedBattleClears: 4,
      expectedBattleClearsSource: "manual",
    })
    expect(cached()).toEqual(saved)
    expect(api.capture).toHaveBeenCalledWith({
      type: "legendary_event_team_created",
      eventId: EVENT,
      laneId: "alpha",
      memberCount: 3,
      objectiveCount: 2,
    })
  })

  it("reorders optimistically and rolls back when the request fails", async () => {
    let reject!: (error: unknown) => void
    api.order.mockReturnValue(
      new Promise((_, fail) => {
        reject = fail
      })
    )
    const { result, cached } = setup(
      plan(4, [team("a", 0), team("b", 1), team("c", 2)])
    )

    let pending!: Promise<string>
    act(() => {
      pending = result.current.reorderLane("alpha", ["c", "a", "b"])
    })
    expect(order(cached())).toEqual(["c", "a", "b"])
    await waitFor(() =>
      expect(api.order).toHaveBeenCalledWith(EVENT, {
        expectedRevision: 4,
        laneId: "alpha",
        teamIds: ["c", "a", "b"],
      })
    )

    await act(async () => {
      reject(new ApiError(500, "Server error"))
      expect(await pending).toBe("error")
    })
    expect(order(cached())).toEqual(["a", "b", "c"])
    expect(toast.error).toHaveBeenCalledWith("teams.toasts.error")
  })

  it("sends a second write with the revision the first one returned", async () => {
    api.order.mockResolvedValue(
      plan(5, [team("b", 0), team("a", 1), team("c", 2)])
    )
    api.remove.mockResolvedValue(plan(6, [team("b", 0), team("a", 1)]))
    const { result, cached } = setup(
      plan(4, [team("a", 0), team("b", 1), team("c", 2)])
    )

    await act(async () => {
      void result.current.reorderLane("alpha", ["b", "a", "c"])
      await result.current.deleteTeam(team("c", 2))
    })

    expect(api.remove).toHaveBeenCalledWith(EVENT, "c", 5)
    expect(cached().revision).toBe(6)
    expect(order(cached())).toEqual(["b", "a"])
  })

  it.each(["legendaryEventPlanStale", "legendaryEventOrderSetMismatch"])(
    "adopts the plan from a %s 409, toasts once and reports a conflict so the editor keeps its draft",
    async (issueCode) => {
      const current = plan(4, [team("a", 0), team("x", 1)])
      api.update.mockRejectedValue(conflict(issueCode, current))
      const { result, cached } = setup(plan(3, [team("a", 0)]))

      let outcome!: string
      await act(async () => {
        outcome = await result.current.updateTeam(team("a", 0), draft)
      })

      expect(outcome).toBe("conflict")
      expect(cached()).toEqual(current)
      expect(toast).toHaveBeenCalledTimes(1)
      expect(toast).toHaveBeenCalledWith("teams.toasts.reloaded")
      expect(toast.error).not.toHaveBeenCalled()
      expect(api.update).toHaveBeenCalledTimes(1)
    }
  )

  it("drops writes queued behind a conflict instead of replaying them, reporting them as conflicts", async () => {
    const current = plan(9, [team("a", 0)])
    api.order.mockRejectedValue(conflict("legendaryEventPlanStale", current))
    const { result, cached } = setup(plan(3, [team("a", 0), team("b", 1)]))

    let second!: Promise<string>
    await act(async () => {
      void result.current.reorderLane("alpha", ["b", "a"])
      second = result.current.deleteTeam(team("b", 1))
      expect(await second).toBe("conflict")
    })

    expect(api.remove).not.toHaveBeenCalled()
    expect(cached()).toEqual(current)
  })

  it("sets the current run's depth as manual and keeps the other runs", async () => {
    const stored = team("a", 0)
    api.update.mockImplementation(async (_event, _id, body) =>
      plan(4, [
        {
          ...stored,
          runDepths: [
            ...stored.runDepths,
            {
              run: 2,
              expectedBattleClears: body.expectedBattleClears,
              expectedBattleClearsSource: "manual",
              recordedAt: "2026-10-08T00:00:00Z",
            },
          ],
        },
      ])
    )
    const { result, cached } = setup(plan(3, [stored]), 2)

    await act(async () => {
      await result.current.setDepth(stored, 9)
    })

    expect(api.update).toHaveBeenCalledWith(EVENT, "a", {
      expectedRevision: 3,
      name: "Team a",
      memberUnitIds: ["u1", "u2"],
      reserveUnitId: null,
      objectiveIndexes: [0],
      run: 2,
      expectedBattleClears: 9,
      expectedBattleClearsSource: "manual",
    })
    expect(cached().teams[0]!.runDepths.map((entry) => entry.run)).toEqual([
      1, 2,
    ])
    expect(api.capture).toHaveBeenCalledWith({
      type: "legendary_event_depth_set",
      eventId: EVENT,
      laneId: "alpha",
      depth: 9,
    })
  })

  it("cancels an in-flight refetch so its older plan cannot overwrite the optimistic one", async () => {
    let resolveFetch!: (value: LegendaryEventPlan) => void
    api.order.mockResolvedValue(plan(5, [team("b", 0), team("a", 1)]))
    const { result, cached, queryClient } = setup(
      plan(4, [team("a", 0), team("b", 1)])
    )
    const refetch = queryClient
      .fetchQuery({
        queryKey: legendaryEventPlanQueries.detail(EVENT).queryKey,
        queryFn: () =>
          new Promise<LegendaryEventPlan>((resolve) => {
            resolveFetch = resolve
          }),
        staleTime: 0,
      })
      .catch(() => undefined)

    let pending!: Promise<string>
    act(() => {
      pending = result.current.reorderLane("alpha", ["b", "a"])
    })
    expect(order(cached())).toEqual(["b", "a"])

    await act(async () => {
      resolveFetch(plan(3, [team("a", 0), team("b", 1)]))
      await refetch
      expect(await pending).toBe("saved")
    })
    expect(cached().revision).toBe(5)
    expect(order(cached())).toEqual(["b", "a"])
  })

  it("does not send a reorder that changes nothing", async () => {
    const { result } = setup(plan(3, [team("a", 0), team("b", 1)]))
    let outcome!: string
    await act(async () => {
      outcome = await result.current.reorderLane("alpha", ["a", "b"])
    })
    expect(outcome).toBe("skipped")
    expect(api.order).not.toHaveBeenCalled()
  })
})
