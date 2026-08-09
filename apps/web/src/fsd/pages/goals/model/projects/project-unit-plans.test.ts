import { describe, expect, it } from "vitest"

import type { GoalRow } from "../shared/types"
import { projectUnitPlans } from "./project-unit-plans"

const goal = (overrides: Partial<GoalRow> = {}): GoalRow => ({
  goalId: "goal-1",
  entityType: "Character",
  entityId: "ragnar",
  goalType: "Rank",
  status: "Active",
  notes: null,
  updatedAt: "2026-08-09T00:00:00Z",
  dependsOn: [],
  priority: 1,
  ...overrides,
})

describe("projectUnitPlans", () => {
  it("groups mixed Character and MoW goals into ordered unit blocks", () => {
    const result = projectUnitPlans([
      goal({
        goalId: "mow",
        entityType: "Mow",
        entityId: "forgefiend",
        priority: 3,
      }),
      goal({ goalId: "rank", priority: 1 }),
      goal({ goalId: "ability", goalType: "Ability", priority: 2 }),
    ])

    expect(result.map((unit) => `${unit.entityType}:${unit.entityId}`)).toEqual(
      ["Character:ragnar", "Mow:forgefiend"]
    )
    expect(result[0]?.goals.map((item) => item.goalId)).toEqual([
      "rank",
      "ability",
    ])
  })

  it("places dependencies first and preserves stable priority for unrelated goals", () => {
    const result = projectUnitPlans([
      goal({ goalId: "dependent", priority: 1, dependsOn: ["prerequisite"] }),
      goal({ goalId: "unrelated", goalType: "Ability", priority: 2 }),
      goal({ goalId: "prerequisite", goalType: "Ascension", priority: 3 }),
    ])

    expect(result[0]?.goals.map((item) => item.goalId)).toEqual([
      "unrelated",
      "prerequisite",
      "dependent",
    ])
  })

  it("keeps historical goals discoverable without creating a priority block", () => {
    const result = projectUnitPlans([
      goal({ goalId: "active" }),
      goal({ goalId: "completed", status: "Completed", priority: 2 }),
      goal({
        goalId: "archived-only",
        entityId: "calgar",
        status: "Archived",
        priority: 3,
      }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0]?.historicalGoals.map((item) => item.goalId)).toEqual([
      "completed",
    ])
    expect(result[0]?.statusCounts.Completed).toBe(1)
  })

  it("uses goal id as deterministic final tie-breaker", () => {
    const result = projectUnitPlans([
      goal({ goalId: "b", priority: 1 }),
      goal({ goalId: "a", priority: 1, goalType: "Ability" }),
    ])
    expect(result[0]?.goals.map((item) => item.goalId)).toEqual(["a", "b"])
  })

  it("groups a realistic 200-unit, 600-goal plan within the dashboard budget", () => {
    const rows = Array.from({ length: 200 }, (_, unitIndex) =>
      (["Rank", "Ability", "Upgrade"] as const).map((goalType, goalIndex) =>
        goal({
          goalId: `goal-${unitIndex}-${goalIndex}`,
          entityId: `unit-${unitIndex}`,
          goalType,
          priority: unitIndex * 10 + goalIndex,
        })
      )
    ).flat()

    const started = performance.now()
    const result = projectUnitPlans(rows)
    const elapsed = performance.now() - started

    expect(result).toHaveLength(200)
    expect(result.every((unitPlan) => unitPlan.goals.length === 3)).toBe(true)
    expect(elapsed).toBeLessThan(250)
  })
})
