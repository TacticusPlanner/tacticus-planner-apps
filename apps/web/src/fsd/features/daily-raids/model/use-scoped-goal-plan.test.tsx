import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useScopedGoalPlan } from "./use-scoped-goal-plan"

const plan = vi.hoisted(() => ({ loading: false, isError: false }))
vi.mock("@/entities/goal", () => ({
  useGlobalGoalPlan: () => ({
    entries: [
      { goal: { goalId: "g1", projectIds: ["p1"] } },
      { goal: { goalId: "g2", projectIds: ["p2"] } },
      { goal: { goalId: "g3", projectIds: ["p1", "p2"] } },
    ],
    ...plan,
  }),
}))

const ids = (entries: { goal: { goalId: string } }[]) =>
  entries.map((entry) => entry.goal.goalId)

describe("useScopedGoalPlan", () => {
  it("returns the whole global plan when no project is selected", () => {
    const { result } = renderHook(() => useScopedGoalPlan(undefined))

    expect(ids(result.current.entries)).toEqual(["g1", "g2", "g3"])
  })

  it("keeps only the goals whose projectIds include the project, in global order", () => {
    const { result } = renderHook(() => useScopedGoalPlan("p1"))

    expect(ids(result.current.entries)).toEqual(["g1", "g3"])
    expect(result.current.loading).toBe(false)
  })

  it("reports a failed goals load as an error, not an empty plan", () => {
    plan.isError = true
    const { result } = renderHook(() => useScopedGoalPlan("p1"))

    expect(result.current.isError).toBe(true)
  })
})
