import { describe, expect, it } from "vitest"

import type { GoalSummary } from "@/entities/goal"
import { conflictingGoalKinds } from ".//use-goal-type-conflicts"

function goal(overrides: Partial<GoalSummary>): GoalSummary {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero-one",
    goalType: "Rank",
    status: "Active",
    notes: null,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  }
}

describe("conflictingGoalKinds", () => {
  it("is empty when no entity is selected", () => {
    expect(conflictingGoalKinds([goal({})], undefined, "Character").size).toBe(
      0
    )
  })

  it("flags a kind with an Active goal for the same entity", () => {
    const kinds = conflictingGoalKinds(
      [goal({ status: "Active", goalType: "Rank" })],
      "hero-one",
      "Character"
    )
    expect(kinds.has("Rank")).toBe(true)
  })

  it("flags a kind with a Paused goal for the same entity", () => {
    const kinds = conflictingGoalKinds(
      [goal({ status: "Paused", goalType: "Ascension" })],
      "hero-one",
      "Character"
    )
    expect(kinds.has("Ascension")).toBe(true)
  })

  it("ignores Completed and Archived goals of the same kind", () => {
    const kinds = conflictingGoalKinds(
      [
        goal({ status: "Completed", goalType: "Rank" }),
        goal({ status: "Archived", goalType: "Ability" }),
      ],
      "hero-one",
      "Character"
    )
    expect(kinds.size).toBe(0)
  })

  it("ignores goals for a different entity", () => {
    const kinds = conflictingGoalKinds(
      [goal({ status: "Active", entityId: "hero-two", goalType: "Rank" })],
      "hero-one",
      "Character"
    )
    expect(kinds.size).toBe(0)
  })

  it("ignores goals for the same id but a different entity type", () => {
    const kinds = conflictingGoalKinds(
      [
        goal({
          status: "Active",
          entityId: "shared-id",
          entityType: "Mow",
          goalType: "Ability",
        }),
      ],
      "shared-id",
      "Character"
    )
    expect(kinds.size).toBe(0)
  })
})
