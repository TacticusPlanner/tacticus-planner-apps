import { beforeAll, describe, expect, it } from "vitest"
import type { TFunction } from "i18next"

import { NO_BLOCKERS, UNKNOWN_PROGRESS } from "@/features/goal-planning"
import type { GoalOverviewMetrics, GoalRow } from "@/features/goal-planning"
import type { EstimateOutcome } from "@/features/goal-farming"
import { createTestI18n } from "@/test/i18n"

import { formatGoalRemainingText } from "../shared/goal-remaining-text"
import { deriveGoalRowData } from "./goal-row-data"

let t: TFunction

beforeAll(async () => {
  t = (await createTestI18n()).t
})

const row = (goalId: string, goalType: GoalRow["goalType"]): GoalRow => ({
  goalId,
  entityType: "Character",
  entityId: "hero1",
  goalType,
  status: "Active",
  priority: 1,
  notes: null,
  updatedAt: "2026-07-15T00:00:00Z",
})

const estimate = {
  status: "Estimated",
  days: 12,
  date: "2026-09-28",
  energyTotal: 1240,
  raidsTotal: 30,
  onslaughtTokens: 4,
  shopSpend: undefined,
} as unknown as EstimateOutcome

const rankMetrics = {
  progress: {
    kind: "Rank",
    current: "Gold3",
    target: "Diamond1",
    targetSlots: 0,
    ratio: 0.4,
    reachableRatio: null,
    reachableRank: null,
    reachableAppliedSlots: null,
    reachableRankLimitedBy: null,
  },
  remaining: null,
  blockers: NO_BLOCKERS,
  levelRequirement: {
    kind: "LevelRequirement",
    current: 41,
    target: 44,
    ratio: 0.9,
    reachableRatio: null,
    reachableLevel: null,
    remainingXp: 9000,
  },
} as unknown as GoalOverviewMetrics

const xpBook = { rarity: "Legendary" as const, xp: 1000 }

describe("deriveGoalRowData", () => {
  it("derives a Rank goal's values from its own slice of each map", () => {
    const data = deriveGoalRowData(
      row("rank", "Rank"),
      {
        metrics: new Map([["rank", rankMetrics]]),
        estimates: new Map([["rank", estimate]]),
        levelChargedXp: new Map([["rank", 9000]]),
        levelPoolXpAvailable: new Map([["rank", 4000]]),
        xpBook,
      },
      t,
      "en"
    )

    expect(data.progress).toBe(rankMetrics.progress)
    expect(data.levelRequirement).toBe(rankMetrics.levelRequirement)
    expect(data.energy).toBe(1240)
    expect(data.onslaughtTokens).toBe(4)
    expect(data.reached).toBe(false)
    expect(data.xpBooks).toEqual({
      available: 4,
      needed: 9,
      rarity: "Legendary",
    })
    expect(data.remainingText).toBe(
      formatGoalRemainingText(t, "en", rankMetrics.progress, null, 1240)
    )
  })

  it("derives an Ability goal with no estimate as having no energy or tokens", () => {
    const abilityMetrics = {
      progress: {
        kind: "Ability",
        currentActive: 8,
        targetActive: 10,
        currentPassive: 5,
        targetPassive: 7,
        ratio: 0.5,
      },
      remaining: null,
      blockers: NO_BLOCKERS,
      levelRequirement: null,
    } as unknown as GoalOverviewMetrics
    const data = deriveGoalRowData(
      row("ability", "Ability"),
      { metrics: new Map([["ability", abilityMetrics]]) },
      t,
      "en"
    )

    expect(data.progress).toBe(abilityMetrics.progress)
    expect(data.energy).toBeUndefined()
    expect(data.onslaughtTokens).toBeUndefined()
    expect(data.xpBooks).toBeUndefined()
  })

  it("derives an Unlock goal's remaining text from its shard count", () => {
    const unlockMetrics = {
      progress: { kind: "Unlock", owned: 329, required: 500, ratio: 0.66 },
      remaining: null,
      blockers: NO_BLOCKERS,
      levelRequirement: null,
    } as unknown as GoalOverviewMetrics
    const data = deriveGoalRowData(
      row("unlock", "Unlock"),
      { metrics: new Map([["unlock", unlockMetrics]]) },
      t,
      "en"
    )

    expect(data.remainingText).toBe(
      formatGoalRemainingText(t, "en", unlockMetrics.progress, null, undefined)
    )
  })

  it("drops the XP-book figure for a Reached goal", () => {
    const data = deriveGoalRowData(
      row("rank", "Rank"),
      {
        metrics: new Map([["rank", rankMetrics]]),
        levelChargedXp: new Map([["rank", 9000]]),
        levelPoolXpAvailable: new Map([["rank", 4000]]),
        xpBook,
        reachedByGoalId: new Map([["rank", true]]),
      },
      t,
      "en"
    )

    expect(data.reached).toBe(true)
    expect(data.xpBooks).toBeUndefined()
  })

  it("falls back to unknown progress and no blockers when a goal has no metrics yet", () => {
    const data = deriveGoalRowData(row("new", "Rank"), {}, t, "en")
    expect(data.progress).toBe(UNKNOWN_PROGRESS)
    expect(data.blockers).toBe(NO_BLOCKERS)
    expect(data.remaining).toBeNull()
  })
})
