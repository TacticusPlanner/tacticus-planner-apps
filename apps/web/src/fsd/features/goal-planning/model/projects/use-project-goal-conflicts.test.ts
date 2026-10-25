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
      progression: null,
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
    candidates: [{ goalType: "Ascension", targetKey: null }],
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
          candidates: [{ goalType: "Rank", targetKey: "13:0" }],
        })
      ).toBe("gold1")
    })

    it("lets a different Rank target coexist", () => {
      expect(
        find([rank("silver3", 11)], {
          candidates: [{ goalType: "Rank", targetKey: "13:0" }],
        })
      ).toBeNull()
    })

    it("checks every candidate of a ladder", () => {
      expect(
        find([rank("gold1", 13)], {
          candidates: [
            { goalType: "Rank", targetKey: "11:0" },
            { goalType: "Rank", targetKey: "13:0" },
          ],
        })
      ).toBe("gold1")
    })
  })

  describe("other targets", () => {
    const ascension = (goalId: string, end: string) =>
      goal(goalId, {
        config: { progression: { start: "Epic:None", end } },
      } as unknown as Partial<GoalDetail>)

    it("lets a different Ascension end coexist and blocks the same end", () => {
      const goals = [ascension("legendary", "Legendary:None")]
      expect(
        find(goals, {
          candidates: [{ goalType: "Ascension", targetKey: "Mythic:None" }],
        })
      ).toBeNull()
      expect(
        find(goals, {
          candidates: [{ goalType: "Ascension", targetKey: "Legendary:None" }],
        })
      ).toBe("legendary")
    })

    it("keeps Unlock to one per unit", () => {
      expect(
        find([goal("unlock", { goalType: "Unlock" })], {
          candidates: [{ goalType: "Unlock", targetKey: null }],
        })
      ).toBe("unlock")
    })
  })
})
