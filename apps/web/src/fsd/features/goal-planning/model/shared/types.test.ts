import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import { goalRowFromSummary } from "./types"

const goalRow = {
  goalId: "goal-1",
  entityType: "Character" as const,
  entityId: "character-1",
  goalType: "Rank" as const,
  status: "Active" as const,
  notes: "Promote next",
  dependsOn: [],
  updatedAt: "2026-07-16T12:00:00Z",
}

const goal = {
  ...goalRow,
  createdAt: "2026-07-15T12:00:00Z",
  globalPriority: 4,
  config: {} as GoalDetail["config"],
  snapshot: null,
  projectIds: ["proj-a"],
  revision: 1,
} satisfies GoalDetail

describe("goal row mappings", () => {
  it("maps a goal to a flat row with its priority", () => {
    expect(goalRowFromSummary(goal)).toEqual({ ...goalRow, priority: 4 })
  })

  it("carries the goal's projects onto the row", () => {
    const projects = [{ projectId: "proj-a", name: "Project A", color: null }]
    expect(goalRowFromSummary(goal, projects)).toEqual({
      ...goalRow,
      priority: 4,
      projects,
    })
  })
})
