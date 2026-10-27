import { globalValuesFixture } from "@workspace/game-catalog/testing"
import { describe, expect, it } from "vitest"

import { HRE_TEAM_SIZE } from "./hre-team-recommendations"
import { HSE_TEAM_SIZE } from "./hse-team-recommendations.types"
import { MIN_TEAM_SIZE } from "./team-recommendations.types"

// The team sizes stay compile-time constants (the engine's types and loops are built around them);
// this fails when the game's battle team limits change.
describe("team sizes", () => {
  it("match the game's battle team limits", () => {
    expect(MIN_TEAM_SIZE).toBe(globalValuesFixture.minUnitsNeededForBattle)
    expect(HSE_TEAM_SIZE).toBe(globalValuesFixture.maxUnitsPossibleForBattle)
    expect(HRE_TEAM_SIZE).toBe(globalValuesFixture.maxUnitsPossibleForBattle)
  })
})
