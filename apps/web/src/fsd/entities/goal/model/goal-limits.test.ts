import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import {
  goalTypesOverLimit,
  isGoalLimitError,
  MAX_GOALS_PER_TYPE,
} from "./goal-limits"
import type { GoalKind } from "./types"

const goals = (goalType: GoalKind, count: number) =>
  Array.from({ length: count }, () => ({ goalType }))

describe("goalTypesOverLimit", () => {
  it("allows a type up to the cap and flags the goal past it", () => {
    const existing = [
      ...goals("Rank", MAX_GOALS_PER_TYPE - 1),
      ...goals("Ability", 3),
    ]
    expect(goalTypesOverLimit(existing, ["Rank", "Ability"])).toEqual([])
    expect(goalTypesOverLimit(existing, ["Rank", "Rank"])).toEqual(["Rank"])
  })

  it("counts every new goal of a type in a combined request", () => {
    expect(
      goalTypesOverLimit(goals("Ascension", 198), [
        "Ascension",
        "Ascension",
        "Ascension",
      ])
    ).toEqual(["Ascension"])
  })

  it("adds nothing for an empty request", () => {
    expect(goalTypesOverLimit(goals("Rank", 500), [])).toEqual([])
  })
})

describe("isGoalLimitError", () => {
  it("recognizes the goalLimitReached problem only", () => {
    expect(
      isGoalLimitError(
        new ApiError(400, "cap", { issueCode: "goalLimitReached" })
      )
    ).toBe(true)
    expect(
      isGoalLimitError(new ApiError(400, "bad", { issueCode: "validation" }))
    ).toBe(false)
    expect(isGoalLimitError(new Error("x"))).toBe(false)
  })
})
