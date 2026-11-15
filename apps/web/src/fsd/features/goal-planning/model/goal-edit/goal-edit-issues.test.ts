import { describe, expect, it } from "vitest"

import type { GoalConfig, GoalDetail } from "@/entities/goal"

import { goalEditIssues } from "./goal-edit-issues"

const emptyConfig: GoalConfig = {
  rank: null,
  progression: null,
  ability: null,
  farmingStrategy: "TotalUpgrades",
  acquisitionSources: null,
  farmingLocationIds: null,
  upgrade: null,
}

const goal = (
  goalType: GoalDetail["goalType"],
  config: Partial<GoalConfig>
): GoalDetail =>
  ({
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero",
    goalType,
    status: "Active",
    config: { ...emptyConfig, ...config },
  }) as GoalDetail

describe("goalEditIssues", () => {
  const ascension = goal("Ascension", {
    progression: { start: "Epic:RedTwoStars", end: "Legendary:RedThreeStars" },
  })

  it("reports a target at or below the start with creation's message", () => {
    expect(
      goalEditIssues(ascension, { kind: "Ascension", end: "Epic:RedOneStar" })
    ).toEqual([
      {
        kind: "Ascension",
        field: "target",
        code: "progressionNotAboveStart",
        messageKey: "goals.create.validation.progressionAlreadyReached",
      },
    ])
  })

  it("reports an untouched stored target below its start too", () => {
    const imported = goal("Ascension", {
      progression: { start: "Epic:RedTwoStars", end: "Epic:RedOneStar" },
    })
    expect(
      goalEditIssues(imported, { kind: "Ascension", end: "Epic:RedOneStar" })
    ).toHaveLength(1)
  })

  it("uses the range message for an ability level out of range, and puts each bad quantity on its row", () => {
    const ability = goal("Ability", {
      ability: {
        activeStart: 35,
        activeEnd: 36,
        passiveStart: 35,
        passiveEnd: 35,
      },
    })
    expect(
      goalEditIssues(ability, {
        kind: "Ability",
        activeEnd: 61,
        passiveEnd: 35,
      })
    ).toMatchObject([
      {
        field: "target",
        messageKey: "goals.create.validation.abilityOutOfRange",
      },
    ])
    expect(
      goalEditIssues(ability, {
        kind: "Ability",
        activeEnd: Number.NaN,
        passiveEnd: 35,
      })
    ).toMatchObject([
      { messageKey: "goals.create.validation.abilityOutOfRange" },
    ])

    const upgrade = goal("Upgrade", {
      upgrade: {
        targets: [{ upgradeId: "a", quantity: 1 }],
        rankRange: null,
        activeRange: null,
        passiveRange: null,
      },
    })
    expect(
      goalEditIssues(upgrade, {
        kind: "Upgrade",
        targets: [
          { upgradeId: "a", quantity: 0 },
          { upgradeId: "b", quantity: 2 },
        ],
        rankRange: null,
        activeRange: null,
        passiveRange: null,
      })
    ).toMatchObject([
      {
        field: "quantity-a",
        messageKey: "goals.create.validation.upgradeQuantity",
      },
    ])
  })
})
