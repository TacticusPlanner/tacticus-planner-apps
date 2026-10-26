import { describe, expect, it } from "vitest"
import { rankIndex, type Rank } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import type { GoalProgress } from "./goal-progress"
import { milestoneSiblings, withMilestoneStart } from "./milestone-siblings"

const goal = (
  goalId: string,
  globalPriority: number,
  goalType: GoalDetail["goalType"],
  config: Record<string, unknown>,
  status = "Active"
) =>
  ({
    goalId,
    globalPriority,
    goalType,
    status,
    entityType: "Character",
    entityId: "ragnar",
    config,
  }) as unknown as GoalDetail

const rankGoal = (goalId: string, priority: number, end: Rank) =>
  goal(goalId, priority, "Rank", {
    rank: {
      start: rankIndex("Silver2"),
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: rankIndex(end),
      endPointFive: false,
      endAppliedUpgrades: 0,
    },
  })

const rankProgress = (target: Rank): GoalProgress =>
  ({
    kind: "Rank",
    current: "Silver2",
    target,
    targetSlots: 0,
    ratio: 0,
    reachableRatio: null,
    reachableRank: null,
    reachableAppliedSlots: null,
    reachableRankLimitedBy: null,
  }) as GoalProgress

const displayedStart = (
  detail: GoalDetail,
  goals: GoalDetail[],
  target: Rank
) => {
  const progress = withMilestoneStart(
    rankProgress(target),
    milestoneSiblings(detail, goals)
  )
  return progress.kind === "Rank" ? progress.current : null
}

describe("milestoneSiblings", () => {
  it("reads each Rank milestone's range from the previous milestone's end", () => {
    const gold1 = rankGoal("gold1", 1, "Gold1")
    const diamond3 = rankGoal("diamond3", 4, "Diamond3")
    const adamantine1 = rankGoal("adamantine1", 9, "Adamantine1")
    const goals = [adamantine1, gold1, diamond3]

    expect(displayedStart(gold1, goals, "Gold1")).toBe("Silver2")
    expect(displayedStart(diamond3, goals, "Diamond3")).toBe("Gold1")
    expect(displayedStart(adamantine1, goals, "Adamantine1")).toBe("Diamond3")
    expect(milestoneSiblings(diamond3, goals)?.coveredBy).toBeNull()
  })

  it("names the higher-priority sibling that covers a lower milestone", () => {
    const adamantine1 = rankGoal("adamantine1", 1, "Adamantine1")
    const diamond3 = rankGoal("diamond3", 2, "Diamond3")

    expect(
      milestoneSiblings(diamond3, [adamantine1, diamond3])?.coveredBy?.goalId
    ).toBe("adamantine1")
    expect(displayedStart(diamond3, [adamantine1, diamond3], "Diamond3")).toBe(
      "Silver2"
    )
  })

  it("ignores completed goals, other units and other types", () => {
    const target = rankGoal("target", 5, "Diamond3")
    const goals = [
      target,
      { ...rankGoal("done", 1, "Gold1"), status: "Completed" },
      { ...rankGoal("other-unit", 2, "Gold1"), entityId: "calgar" },
      goal("ascension", 3, "Ascension", {
        progression: { start: "Epic:None", end: "Legendary:RedFiveStars" },
      }),
    ] as GoalDetail[]

    expect(milestoneSiblings(target, goals)).toEqual({
      coveredBy: null,
      previousEnds: [null],
    })
  })

  it("chains Ascension and Ability milestones too", () => {
    const legendary = goal("legendary", 1, "Ascension", {
      progression: {
        start: "Epic:RedThreeStars",
        end: "Legendary:RedFourStars",
      },
    })
    const blue = goal("blue", 2, "Ascension", {
      progression: {
        start: "Epic:RedThreeStars",
        end: "Legendary:OneBlueStar",
      },
    })
    const ascension = withMilestoneStart(
      {
        kind: "Ascension",
        current: "Epic:RedThreeStars",
        target: "Legendary:OneBlueStar",
        ratio: 0,
      },
      milestoneSiblings(blue, [legendary, blue])
    )
    expect(ascension).toMatchObject({ current: "Legendary:RedFourStars" })

    const ability45 = goal("a45", 1, "Ability", {
      ability: {
        activeStart: 40,
        activeEnd: 45,
        passiveStart: 40,
        passiveEnd: 45,
      },
    })
    const ability50 = goal("a50", 2, "Ability", {
      ability: {
        activeStart: 40,
        activeEnd: 50,
        passiveStart: 40,
        passiveEnd: 50,
      },
    })
    const ability = withMilestoneStart(
      {
        kind: "Ability",
        currentActive: 40,
        targetActive: 50,
        currentPassive: 40,
        targetPassive: 50,
        ratio: 0,
      },
      milestoneSiblings(ability50, [ability45, ability50])
    )
    expect(ability).toMatchObject({ currentActive: 45, currentPassive: 45 })
    expect(
      milestoneSiblings(ability45, [ability50, ability45])?.coveredBy
    ).toBe(null)
  })

  it("takes both Ability tracks from one predecessor", () => {
    const ability = (
      goalId: string,
      priority: number,
      active: number,
      passive: number
    ) =>
      goal(goalId, priority, "Ability", {
        ability: {
          activeStart: 30,
          activeEnd: active,
          passiveStart: 30,
          passiveEnd: passive,
        },
      })
    const left = ability("left", 1, 40, 45)
    const right = ability("right", 2, 45, 40)
    const sideways = ability("sideways", 3, 55, 35)
    const target = ability("target", 4, 50, 50)
    const goals = [left, right, sideways, target]
    expect(milestoneSiblings(target, goals)?.previousEnds).toEqual([45, 40])
    expect(milestoneSiblings(target, goals)?.coveredBy).toBe(null)
  })
})
