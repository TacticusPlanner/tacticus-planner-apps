import { describe, expect, it } from "vitest"

import type { LegendaryEventRosterUnit } from "@/entities/legendary-event"

import {
  leaderboardRowPrefill,
  prefillGoalType,
  stepInGoals,
  upgradeStepPrefill,
} from "./create-goal-prefill"

const unit = {
  unitId: "ultraTigurius",
  rank: "Gold1",
  progressionIndex: "Epic:RedTwoStars",
} as LegendaryEventRosterUnit

describe("leaderboardRowPrefill", () => {
  it("opens an owned or unknown unit with no goal type", () => {
    for (const ownership of ["owned", "unknown"] as const) {
      const prefill = leaderboardRowPrefill("ultraTigurius", ownership)
      expect(prefill).toEqual({
        entityType: "Character",
        entityId: "ultraTigurius",
      })
      expect(prefillGoalType(prefill)).toBeNull()
    }
  })

  it("opens a locked unit with Unlock", () => {
    expect(leaderboardRowPrefill("ultraEliminatorSgt", "locked")).toEqual({
      entityType: "Character",
      entityId: "ultraEliminatorSgt",
      goalType: "Unlock",
    })
  })
})

describe("upgradeStepPrefill", () => {
  it("prefills an Ascension step's progression", () => {
    const prefill = upgradeStepPrefill("ultraTigurius", {
      kind: "ascension",
      progression: "Epic:RedThreeStars",
      unit,
    })
    expect(prefill).toEqual({
      entityType: "Character",
      entityId: "ultraTigurius",
      goalType: "Ascension",
      requiredProgression: "Epic:RedThreeStars",
    })
    expect(prefillGoalType(prefill)).toBe("Ascension")
  })

  it("prefills a Rank step's rank and an Unlock step", () => {
    expect(
      upgradeStepPrefill("ultraCalgar", { kind: "rank", rank: "Silver3", unit })
    ).toMatchObject({ goalType: "Rank", rankEnd: "Silver3" })
    expect(
      upgradeStepPrefill("ultraEliminatorSgt", { kind: "unlock", unit })
    ).toMatchObject({ goalType: "Unlock", entityId: "ultraEliminatorSgt" })
  })
})

describe("stepInGoals", () => {
  const ascension = {
    kind: "ascension",
    progression: "Epic:RedThreeStars",
    unit,
  } as const

  it("is true for a goal at or beyond the step", () => {
    const target = {
      unitId: "ultraTigurius",
      goals: [
        {
          goalId: "g",
          kind: "Ascension" as const,
          progressionEnd: "Legendary:RedThreeStars" as const,
        },
      ],
    }
    expect(stepInGoals(ascension, target)).toBe(true)
    expect(stepInGoals({ kind: "rank", rank: "Gold2", unit }, target)).toBe(
      false
    )
  })

  it("is false below the step or without goals", () => {
    const target = {
      unitId: "ultraTigurius",
      goals: [
        {
          goalId: "g",
          kind: "Ascension" as const,
          progressionEnd: "Epic:RedTwoStars" as const,
        },
      ],
    }
    expect(stepInGoals(ascension, target)).toBe(false)
    expect(stepInGoals(ascension, undefined)).toBe(false)
    expect(stepInGoals({ kind: "unlock", unit }, target)).toBe(true)
  })
})
