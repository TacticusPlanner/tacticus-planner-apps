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
              goalType: "Ascension",
              status: "Paused",
            },
          },
        ],
      ],
      entityType: "Character",
      entityId: "ragnar",
      goalTypes: ["Ascension"],
    })

    expect(conflicts).toEqual([
      {
        projectId: "occupied",
        existingGoalId: "existing",
        goalTypes: ["Ascension"],
      },
    ])
  })

  describe("Rank targets", () => {
    const rankGoal = (goalId: string, status = "Active") => ({
      goal: {
        goalId,
        entityType: "Character",
        entityId: "ragnar",
        goalType: "Rank",
        status,
      },
    })
    const find = (
      rankTargetKey: string | null,
      keys: [string, string][],
      goals = [rankGoal("silver3")]
    ) =>
      findProjectGoalConflicts({
        selected: [project("a"), project("b")],
        projectGoals: [goals, []],
        entityType: "Character",
        entityId: "ragnar",
        goalTypes: ["Rank"],
        rankTargetKey,
        rankKeyByGoalId: new Map(keys),
      })

    it("conflicts only with the exact same normalized target, naming it", () => {
      expect(find("12:0", [["silver3", "12:0"]])).toEqual([
        {
          projectId: "a",
          existingGoalId: "silver3",
          goalTypes: ["Rank"],
          rankTargetKey: "12:0",
        },
      ])
    })

    it("lets a different Rank target coexist in the same project", () => {
      expect(find("15:0", [["silver3", "12:0"]])).toEqual([])
    })

    it("reports nothing while the new or existing target is unknown (the server stays authoritative)", () => {
      expect(find(null, [["silver3", "12:0"]])).toEqual([])
      expect(find("12:0", [])).toEqual([])
    })

    it("ignores a Completed or Archived goal at the same target", () => {
      expect(
        find("12:0", [["silver3", "12:0"]], [rankGoal("silver3", "Completed")])
      ).toEqual([])
    })
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
