import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useLegendaryEventGoalTargets } from "./use-legendary-event-goal-targets"

const plan = vi.hoisted(() => ({
  active: [] as unknown[],
  loading: false,
  isError: false,
}))

vi.mock("@/entities/goal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/goal")>()
  return {
    ...actual,
    useGlobalGoalPlan: () => plan,
  }
})

// The global plan carries every goal in full (no per-goal read).
const goal = (
  goalId: string,
  entityId: string,
  config: object = {},
  status = "Active"
) => ({
  goalId,
  entityId,
  goalType: goalId.split("-")[0],
  entityType: "Character",
  status,
  config: { rank: null, progression: null, ability: null, ...config },
})

const ALLOWED = new Set(["ultraTigurius", "ultraEliminatorSgt"])

function setup() {
  return renderHook(() => useLegendaryEventGoalTargets(ALLOWED))
}

describe("useLegendaryEventGoalTargets", () => {
  beforeEach(() => {
    plan.active = []
    plan.loading = false
    plan.isError = false
  })

  it("is loading while the goal list loads", () => {
    plan.loading = true
    expect(setup().result.current).toEqual({ status: "loading" })
  })

  it("fails when the goal list fails", () => {
    plan.isError = true
    expect(setup().result.current).toEqual({ status: "failed" })
  })

  it("maps Rank and Ascension goals and ignores Paused goals, other units and other kinds", () => {
    plan.active = [
      goal("Ascension-1", "ultraTigurius", {
        progression: {
          start: "Epic:RedOneStar",
          end: "Legendary:RedThreeStars",
        },
      }),
      goal("Rank-2", "ultraTigurius", {
        rank: { end: 13, endPointFive: false, endAppliedUpgrades: 0 },
      }),
      goal("Unlock-3", "ultraEliminatorSgt", {}, "Paused"),
      goal("Unlock-4", "ultraCalgar"),
      goal("Upgrade-5", "ultraTigurius"),
    ]
    const { result } = setup()
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
    plan.active = [goal("Unlock-4", "ultraCalgar")]
    const { result } = setup()
    expect(result.current).toMatchObject({ status: "ready", targets: [] })
  })
})
