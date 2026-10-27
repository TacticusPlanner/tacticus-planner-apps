import { describe, expect, it } from "vitest"
import {
  abilityCapByRarity,
  isRank,
  lastRank,
  levelCapByRarity,
  maxRankForProgression,
  progressionOrder,
  progressionRarity,
} from "@workspace/game-domain"

import { progressionRulesFixture } from "./progression-rules.fixtures"

// game-domain keeps the progression ladder and its per-rarity caps in code, since they are read
// synchronously across the app. These tests pin them to the served `progression-rules` record, so a
// game change to either fails here.
describe("game-domain progression constants match progression-rules", () => {
  const { heroProgressionSteps, mowProgressionSteps } = progressionRulesFixture

  it("walks the same ascension ladder for heroes and MoWs", () => {
    expect(heroProgressionSteps.map((step) => step.progression)).toEqual(
      progressionOrder
    )
    expect(mowProgressionSteps.map((step) => step.progression)).toEqual(
      progressionOrder
    )
  })

  it("caps character levels per rarity at the game's max XP level", () => {
    for (const step of heroProgressionSteps) {
      expect(levelCapByRarity[step.rarity], step.progression).toBe(
        step.maxXpLevel
      )
    }
  })

  it("caps hero abilities per rarity at the game's max XP level", () => {
    for (const step of heroProgressionSteps) {
      expect(abilityCapByRarity[step.rarity], step.progression).toBe(
        step.maxXpLevel
      )
    }
  })

  it("caps MoW abilities per rarity at the same levels", () => {
    for (const step of mowProgressionSteps) {
      expect(abilityCapByRarity[step.rarity], step.progression).toBe(
        step.maxAbilityLevel
      )
    }
  })

  it("caps ranks per rarity at the game's max rank, within the planner's ladder", () => {
    for (const step of heroProgressionSteps) {
      // The game already lists Adamantine3, which the planner's rank ladder stops short of.
      const gameMax = isRank(step.maxRank) ? step.maxRank : lastRank
      expect(maxRankForProgression(step.progression), step.progression).toBe(
        gameMax
      )
      expect(progressionRarity(step.progression)).toBe(step.rarity)
    }
  })
})
