import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useLegendaryEventGoalTargets } from "./use-legendary-event-goal-targets"

const plan = vi.hoisted(() => ({
  active: [] as unknown[],
  loading: false,
  isError: false,
}))
const getGoal = vi.hoisted(() => vi.fn())

vi.mock("@/entities/goal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/goal")>()
  return {
    ...actual,
    useGlobalGoalPlan: () => plan,
    goalQueries: {
      detail: (goalId: string) => ({
        queryKey: ["goals", "detail", goalId],
        queryFn: () => getGoal(goalId),
      }),
    },
  }
})

const summary = (
  goalId: string,
  entityId: string,
  goalType: string,
  status = "Active"
) => ({ goalId, entityId, goalType, status, entityType: "Character" })

const detail = (goalId: string, entityId: string, config: object) => ({
  goalId,
  entityId,
  goalType: goalId.split("-")[0],
  entityType: "Character",
  status: "Active",
  config: { rank: null, progression: null, ability: null, ...config },
})

const ALLOWED = new Set(["ultraTigurius", "ultraEliminatorSgt"])

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useLegendaryEventGoalTargets(ALLOWED), { wrapper })
}

describe("useLegendaryEventGoalTargets", () => {
  beforeEach(() => {
    plan.active = []
    plan.loading = false
    plan.isError = false
    getGoal.mockReset()
  })

  it("is loading while the goal list loads", () => {
    plan.loading = true
    expect(setup().result.current).toEqual({ status: "loading" })
  })

  it("fails when the goal list fails", () => {
    plan.isError = true
    expect(setup().result.current).toEqual({ status: "failed" })
  })

  it("fails when a goal detail fails", async () => {
    plan.active = [summary("Unlock-1", "ultraEliminatorSgt", "Unlock")]
    getGoal.mockRejectedValue(new Error("down"))
    const { result } = setup()
    await waitFor(() => expect(result.current.status).toBe("failed"))
  })

  it("maps Rank and Ascension details and ignores Paused goals and other units", async () => {
    plan.active = [
      summary("Ascension-1", "ultraTigurius", "Ascension"),
      summary("Rank-2", "ultraTigurius", "Rank"),
      summary("Unlock-3", "ultraEliminatorSgt", "Unlock", "Paused"),
      summary("Unlock-4", "ultraCalgar", "Unlock"),
      summary("Upgrade-5", "ultraTigurius", "Upgrade"),
    ]
    getGoal.mockImplementation((goalId: string) =>
      Promise.resolve(
        goalId === "Rank-2"
          ? detail(goalId, "ultraTigurius", {
              rank: { end: 13, endPointFive: false, endAppliedUpgrades: 0 },
            })
          : detail(goalId, "ultraTigurius", {
              progression: {
                start: "Epic:RedOneStar",
                end: "Legendary:RedThreeStars",
              },
            })
      )
    )
    const { result } = setup()
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(getGoal.mock.calls.map(([goalId]) => goalId)).toEqual([
      "Ascension-1",
      "Rank-2",
    ])
    const ready = result.current as Extract<
      typeof result.current,
      { status: "ready" }
    >
    expect(ready.targets).toEqual([
      {
        unitId: "ultraTigurius",
        goals: [
          {
            goalId: "Ascension-1",
            kind: "Ascension",
            progressionEnd: "Legendary:RedThreeStars",
          },
          {
            goalId: "Rank-2",
            kind: "Rank",
            rankEnd: "Gold2",
            appliedUpgradesEnd: 0,
          },
        ],
      },
    ])
    expect(ready.byUnit.get("ultraTigurius")).toBe(ready.targets[0])
  })

  it("is ready with no targets when no Active goal targets the event's units", () => {
    plan.active = [summary("Unlock-4", "ultraCalgar", "Unlock")]
    const { result } = setup()
    expect(result.current).toMatchObject({ status: "ready", targets: [] })
  })
})
