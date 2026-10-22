import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import { findGoalSlotConflict } from "./use-project-goal-conflicts"

const goal = (
  goalId: string,
  overrides: Partial<GoalDetail> & { rankEnd?: number } = {}
) => {
  const { rankEnd, ...rest } = overrides
  return {
    goalId,
    entityType: "Character",
    entityId: "ragnar",
    goalType: "Ascension",
    status: "Active",
    projectIds: ["p1"],
    config: {
      rank:
        rankEnd === undefined
          ? null
          : {
              start: 0,
              startPointFive: false,
              startAppliedUpgrades: 0,
              end: rankEnd,
              endPointFive: false,
              endAppliedUpgrades: 0,
            },
    },
    ...rest,
  } as unknown as GoalDetail
}

const find = (
  goals: GoalDetail[],
  options: Partial<Parameters<typeof findGoalSlotConflict>[0]> = {}
) =>
  findGoalSlotConflict({
    goals,
    entityType: "Character",
    entityId: "ragnar",
    goalTypes: ["Ascension"],
    ...options,
  })?.goalId ?? null

describe("findGoalSlotConflict", () => {
  it("finds the in-flight goal holding the unit's slot, whatever project holds it", () => {
    expect(find([goal("other-project", { projectIds: ["p9"] })])).toBe(
      "other-project"
    )
  })

  it("ignores Completed and Archived goals, other units and other kinds", () => {
    expect(
      find([
        goal("done", { status: "Completed" }),
        goal("archived", { status: "Archived" }),
        goal("other-unit", { entityId: "calgar" }),
        goal("other-kind", { goalType: "Unlock" }),
      ])
    ).toBeNull()
  })

  it("excludes the goal being edited", () => {
    expect(find([goal("self")], { excludeGoalId: "self" })).toBeNull()
  })

  describe("Rank targets", () => {
    const rank = (goalId: string, rankEnd: number) =>
      goal(goalId, { goalType: "Rank", rankEnd })

    it("conflicts only with the exact same normalized target", () => {
      expect(
        find([rank("silver3", 11), rank("gold1", 13)], {
          goalTypes: ["Rank"],
          rankTargetKey: "13:0",
        })
      ).toBe("gold1")
    })

    it("lets a different Rank target coexist", () => {
      expect(
        find([rank("silver3", 11)], {
          goalTypes: ["Rank"],
          rankTargetKey: "13:0",
        })
      ).toBeNull()
    })

    it("reports nothing while the new target is unknown (the server stays authoritative)", () => {
      expect(find([rank("gold1", 13)], { goalTypes: ["Rank"] })).toBeNull()
    })
  })
})
