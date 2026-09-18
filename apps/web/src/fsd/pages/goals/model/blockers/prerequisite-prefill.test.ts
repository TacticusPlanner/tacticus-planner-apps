import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"
import { prerequisitePrefill } from ".//prerequisite-prefill"

function detail(overrides: Partial<GoalDetail> = {}): GoalDetail {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "unit-1",
    goalType: "Rank",
    status: "Active",
    notes: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    projectIds: ["project-1"],
    dependsOn: [],
    events: [],
    snapshot: null,
    config: {} as never,
    ...overrides,
  } as unknown as GoalDetail
}

describe("prerequisitePrefill", () => {
  it("maps a missing-Unlock reason to an Unlock prefill for the same unit", () => {
    expect(
      prerequisitePrefill(detail(), {
        kind: "MissingUnlockPrerequisite",
        unitName: "Bellator",
        existingGoalId: undefined,
      })
    ).toEqual({
      entityType: "Character",
      entityId: "unit-1",
      goalType: "Unlock",
      projectIds: ["project-1"],
    })
  })

  it("maps a missing-Unlock reason for a Mow to an Unlock prefill", () => {
    expect(
      prerequisitePrefill(detail({ entityType: "Mow" }), {
        kind: "MissingUnlockPrerequisite",
        unitName: "Titan",
        existingGoalId: undefined,
      })
    ).toEqual({
      entityType: "Mow",
      entityId: "unit-1",
      goalType: "Unlock",
      projectIds: ["project-1"],
    })
  })
})
