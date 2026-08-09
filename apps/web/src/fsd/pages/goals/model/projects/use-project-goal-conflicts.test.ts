import { describe, expect, it } from "vitest"

import type { ProjectSummary } from "@/entities/project"
import { findProjectGoalConflicts } from "./use-project-goal-conflicts"

const project = (projectId: string): ProjectSummary => ({
  projectId,
  name: projectId,
  description: null,
  color: null,
  status: "Active",
  isActivePlan: false,
  isDefault: false,
  revision: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
})

describe("findProjectGoalConflicts", () => {
  it("identifies only selected projects with matching in-flight slots", () => {
    const conflicts = findProjectGoalConflicts({
      selected: [project("available"), project("occupied")],
      projectGoals: [
        [],
        [
          {
            goal: {
              goalId: "existing",
              entityType: "Character",
              entityId: "ragnar",
              goalType: "Rank",
              status: "Paused",
            },
          },
        ],
      ],
      entityType: "Character",
      entityId: "ragnar",
      goalTypes: ["Rank"],
    })

    expect(conflicts).toEqual([
      {
        projectId: "occupied",
        existingGoalId: "existing",
        goalTypes: ["Rank"],
      },
    ])
  })

  it("ignores Completed and Archived matching goals", () => {
    const statuses = ["Completed", "Archived"]
    const conflicts = findProjectGoalConflicts({
      selected: [project("history")],
      projectGoals: [
        statuses.map((status) => ({
          goal: {
            goalId: status,
            entityType: "Character",
            entityId: "ragnar",
            goalType: "Rank",
            status,
          },
        })),
      ],
      entityType: "Character",
      entityId: "ragnar",
      goalTypes: ["Rank"],
    })
    expect(conflicts).toEqual([])
  })

  it("allows the same slot in a different project and excludes the goal being edited", () => {
    const conflicts = findProjectGoalConflicts({
      selected: [project("new-home")],
      projectGoals: [
        [
          {
            goal: {
              goalId: "current-goal",
              entityType: "Character",
              entityId: "ragnar",
              goalType: "Rank",
              status: "Active",
            },
          },
        ],
      ],
      entityType: "Character",
      entityId: "ragnar",
      goalTypes: ["Rank"],
      excludeGoalId: "current-goal",
    })

    expect(conflicts).toEqual([])
  })
})
