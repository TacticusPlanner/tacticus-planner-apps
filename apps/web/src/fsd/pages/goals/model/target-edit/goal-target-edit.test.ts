import { describe, expect, it } from "vitest"
import { Rank, rankIndex } from "@workspace/game-domain"

import type { GoalConfig, GoalDetail } from "@/entities/goal"

import { getGoalValidationIssue } from "../goal-creation-form/goal-validation"
import {
  getGoalTargetIssue,
  goalTargetDraftFromDetail,
  goalTargetEditFromDraft,
  isGoalTargetDraftChanged,
  isGoalTargetEditable,
  rankEndOptionsFor,
  type GoalTargetDraft,
} from "./goal-target-edit"

const emptyConfig: GoalConfig = {
  rank: null,
  progression: null,
  ability: null,
  farmingStrategy: "TotalUpgrades",
  acquisitionSources: null,
  farmingLocationIds: null,
  upgrade: null,
  level: null,
}

function goal(
  goalType: GoalDetail["goalType"],
  config: Partial<GoalConfig>,
  status: GoalDetail["status"] = "Active"
): GoalDetail {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero",
    goalType,
    status,
    notes: null,
    dependsOn: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    config: { ...emptyConfig, ...config },
    snapshot: null,
    events: [],
    projectIds: ["project-1"],
    revision: 3,
  }
}

const rankGoal = (end: number, endPointFive = false, applied = 0) =>
  goal("Rank", {
    rank: {
      start: rankIndex(Rank.Silver1),
      startPointFive: false,
      startAppliedUpgrades: 0,
      end,
      endPointFive,
      endAppliedUpgrades: applied,
    },
  })

describe("isGoalTargetEditable", () => {
  it.each(["Rank", "Ascension", "Level", "Ability", "Upgrade"] as const)(
    "offers editing for an active %s goal",
    (kind) => {
      expect(isGoalTargetEditable({ goalType: kind, status: "Active" })).toBe(
        true
      )
      expect(isGoalTargetEditable({ goalType: kind, status: "Paused" })).toBe(
        true
      )
    }
  )

  it("never offers editing for Unlock or terminal goals", () => {
    expect(isGoalTargetEditable({ goalType: "Unlock", status: "Active" })).toBe(
      false
    )
    expect(
      isGoalTargetEditable({ goalType: "Rank", status: "Completed" })
    ).toBe(false)
    expect(isGoalTargetEditable({ goalType: "Rank", status: "Archived" })).toBe(
      false
    )
  })
})

describe("goalTargetDraftFromDetail", () => {
  it("prefills the stored end rank and its additional target", () => {
    const draft = goalTargetDraftFromDetail(
      rankGoal(rankIndex(Rank.Gold1), true)
    )

    expect(draft).toEqual({
      kind: "Rank",
      end: Rank.Gold1,
      additional: "TopRow",
    })
  })

  it("prefills each of the other kinds from their stored target", () => {
    expect(
      goalTargetDraftFromDetail(
        goal("Ascension", {
          progression: { start: "Common:None", end: "Rare:FourStars" },
        })
      )
    ).toEqual({ kind: "Ascension", end: "Rare:FourStars" })
    expect(
      goalTargetDraftFromDetail(goal("Level", { level: { start: 1, end: 20 } }))
    ).toEqual({ kind: "Level", end: 20 })
    expect(
      goalTargetDraftFromDetail(
        goal("Ability", {
          ability: {
            activeStart: 1,
            activeEnd: 5,
            passiveStart: 2,
            passiveEnd: 2,
          },
        })
      )
    ).toEqual({ kind: "Ability", activeEnd: 5, passiveEnd: 2 })
    expect(
      goalTargetDraftFromDetail(
        goal("Upgrade", {
          upgrade: { targets: [{ upgradeId: "upgHpC014", quantity: 3 }] },
        })
      )
    ).toEqual({
      kind: "Upgrade",
      targets: [{ upgradeId: "upgHpC014", quantity: 3 }],
    })
  })

  it("has no draft for an Unlock goal", () => {
    expect(goalTargetDraftFromDetail(goal("Unlock", {}))).toBeNull()
  })
})

describe("goalTargetEditFromDraft", () => {
  it("sends only the end values of the draft's own kind", () => {
    expect(
      goalTargetEditFromDraft({
        kind: "Rank",
        end: Rank.Gold1,
        additional: "TopRow",
      })
    ).toEqual({
      rank: {
        end: rankIndex(Rank.Gold1),
        endPointFive: true,
        endAppliedUpgrades: 0,
      },
    })
    expect(
      goalTargetEditFromDraft({
        kind: "Ability",
        activeEnd: 7,
        passiveEnd: 3,
      })
    ).toEqual({ ability: { activeEnd: 7, passiveEnd: 3 } })
    expect(goalTargetEditFromDraft({ kind: "Level", end: 30 })).toEqual({
      level: { end: 30 },
    })
  })

  it("round-trips a stored target unchanged", () => {
    const detail = rankGoal(rankIndex(Rank.Gold1), false, 2)
    const draft = goalTargetDraftFromDetail(detail)!

    expect(goalTargetEditFromDraft(draft).rank).toEqual({
      end: rankIndex(Rank.Gold1),
      endPointFive: false,
      endAppliedUpgrades: 2,
    })
    expect(isGoalTargetDraftChanged(detail, draft)).toBe(false)
  })
})

describe("isGoalTargetDraftChanged", () => {
  it("is true once the draft leaves the stored target", () => {
    const detail = rankGoal(rankIndex(Rank.Gold1))

    expect(
      isGoalTargetDraftChanged(detail, {
        kind: "Rank",
        end: Rank.Gold2,
        additional: "None",
      })
    ).toBe(true)
  })
})

describe("getGoalTargetIssue", () => {
  it("accepts a rank above the stored start, even if already reached in game", () => {
    const draft: GoalTargetDraft = {
      kind: "Rank",
      end: Rank.Silver2,
      additional: "None",
    }

    expect(
      getGoalTargetIssue(rankGoal(rankIndex(Rank.Gold1)), draft)
    ).toBeNull()
  })

  it("rejects a rank at or below the stored start", () => {
    expect(
      getGoalTargetIssue(rankGoal(rankIndex(Rank.Gold1)), {
        kind: "Rank",
        end: Rank.Silver1,
        additional: "None",
      })
    ).toBe("rankNotAboveStart")
  })

  it("keeps Ability tracks independent and requires one to advance", () => {
    const detail = goal("Ability", {
      ability: { activeStart: 5, activeEnd: 8, passiveStart: 4, passiveEnd: 6 },
    })

    expect(
      getGoalTargetIssue(detail, {
        kind: "Ability",
        activeEnd: 9,
        passiveEnd: 6,
      })
    ).toBeNull()
    expect(
      getGoalTargetIssue(detail, {
        kind: "Ability",
        activeEnd: 4,
        passiveEnd: 6,
      })
    ).toBe("abilityBelowStart")
    expect(
      getGoalTargetIssue(detail, {
        kind: "Ability",
        activeEnd: 5,
        passiveEnd: 4,
      })
    ).toBe("abilityNoAdvance")
  })

  it("rejects an Ascension target at or below the start", () => {
    const detail = goal("Ascension", {
      progression: { start: "Rare:FourStars", end: "Rare:FiveStars" },
    })

    expect(
      getGoalTargetIssue(detail, { kind: "Ascension", end: "Rare:FourStars" })
    ).toBe("progressionNotAboveStart")
  })

  it("bounds a Level target by the start and the level cap", () => {
    const detail = goal("Level", { level: { start: 10, end: 20 } })

    expect(getGoalTargetIssue(detail, { kind: "Level", end: 10 })).toBe(
      "levelNotAboveStart"
    )
    expect(getGoalTargetIssue(detail, { kind: "Level", end: 999 })).toBe(
      "levelAboveMax"
    )
    expect(getGoalTargetIssue(detail, { kind: "Level", end: 21 })).toBeNull()
  })

  it("requires every Upgrade quantity to be a positive whole number", () => {
    const detail = goal("Upgrade", {
      upgrade: { targets: [{ upgradeId: "upgHpC014", quantity: 3 }] },
    })
    const withQuantity = (quantity: number): GoalTargetDraft => ({
      kind: "Upgrade",
      targets: [{ upgradeId: "upgHpC014", quantity }],
    })

    expect(getGoalTargetIssue(detail, withQuantity(0))).toBe("upgradeQuantity")
    expect(getGoalTargetIssue(detail, withQuantity(1.5))).toBe(
      "upgradeQuantity"
    )
    expect(getGoalTargetIssue(detail, withQuantity(10001))).toBe(
      "upgradeQuantity"
    )
    expect(getGoalTargetIssue(detail, withQuantity(10000))).toBeNull()
    expect(getGoalTargetIssue(detail, withQuantity(4))).toBeNull()
    expect(getGoalTargetIssue(detail, { kind: "Upgrade", targets: [] })).toBe(
      "upgradeEmpty"
    )
  })

  it("agrees with creation validation on shape when live progress equals the start", () => {
    // With the unit's live rank equal to the stored start, creation and editing must reject and accept
    // exactly the same Rank targets; likewise for Level — the parity guarantee behind the shared rules.
    const start = rankIndex(Rank.Silver1)
    const detail = rankGoal(rankIndex(Rank.Gold1))
    for (const end of [Rank.Iron1, Rank.Silver1, Rank.Silver2, Rank.Gold3]) {
      const creation = getGoalValidationIssue({
        hasEntityId: true,
        enabledTypes: new Set(["Rank"] as const),
        isOwned: true,
        currentRank: Rank.Silver1,
        rankEnd: end,
        currentProgression: undefined,
        progressionEnd: "Common:None",
        abilityActiveStart: 0,
        abilityActiveEnd: 1,
        abilityPassiveStart: 0,
        abilityPassiveEnd: 0,
        currentActiveAbility: 0,
        currentPassiveAbility: 0,
        currentLevel: undefined,
        levelEnd: 1,
        upgradeFieldsValid: true,
      })
      const edit = getGoalTargetIssue(detail, {
        kind: "Rank",
        end,
        additional: "None",
      })

      expect(edit === null).toBe(creation === null)
      expect(edit === null).toBe(rankIndex(end) > start)
    }
  })
})

describe("rankEndOptionsFor", () => {
  it("lists only ranks above the stored start", () => {
    const options = rankEndOptionsFor(rankGoal(rankIndex(Rank.Gold1)))

    expect(options[0]).toBe(Rank.Silver2)
    expect(options).not.toContain(Rank.Silver1)
  })
})
