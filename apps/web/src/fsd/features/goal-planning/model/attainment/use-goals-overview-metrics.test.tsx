import { describe, expect, it, vi } from "vitest"
import { renderHook } from "@/test/render"

const goalsList = vi.hoisted(() => ({
  goalsById: new Map<string, unknown>(),
  loading: false,
  isError: false,
}))

vi.mock("@/entities/goal", () => ({
  useGoalsById: () => ({ ...goalsList, retry: () => {} }),
}))

// Pass-through that counts the per-goal computation runs.
const progressRuns = vi.hoisted(() => ({ count: 0 }))
vi.mock("./goal-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./goal-progress")>()
  return {
    ...actual,
    computeGoalProgress: (
      ...args: Parameters<typeof actual.computeGoalProgress>
    ) => {
      progressRuns.count++
      return actual.computeGoalProgress(...args)
    },
  }
})

import { useGoalsOverviewMetrics } from "./use-goals-overview-metrics"

describe("useGoalsOverviewMetrics", () => {
  it("keeps the same map across re-renders with equal inputs, and a new one when an input changes", () => {
    goalsList.goalsById = new Map([
      [
        "goal-1",
        {
          goalId: "goal-1",
          entityId: "hero1",
          entityType: "Character",
          goalType: "Rank",
          config: { rank: { end: 1 } },
          dependsOn: [],
        },
      ],
    ])
    const { result, rerender } = renderHook(
      ({ ids }) => useGoalsOverviewMetrics(ids),
      { initialProps: { ids: ["goal-1"] } }
    )
    const first = result.current
    const runs = progressRuns.count

    // A freshly mapped id array with the same ids, as the Goals page passes every render: the
    // per-goal maths does not run again.
    rerender({ ids: ["goal-1"] })
    expect(result.current).toBe(first)
    expect(progressRuns.count).toBe(runs)

    rerender({ ids: ["goal-1", "goal-2"] })
    expect(result.current).not.toBe(first)
    expect([...result.current.keys()]).toEqual(["goal-1", "goal-2"])
  })
})
