import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import type { UnitTileUnit } from "@/entities/unit"

import { toBulkGoalUnit } from "./collection-selection"

describe("toBulkGoalUnit", () => {
  it("keeps an owned unit's current values", () => {
    const unit: UnitTileUnit = {
      kind: "character",
      unitId: "spaceRagnar" as UnitId,
      name: "Ragnar",
      data: {
        state: "owned",
        progression: "Legendary:RedThreeStars",
        rank: "Gold1",
        abilityLevels: [30, 28],
        shards: 0,
        mythicShards: 0,
      },
    }
    expect(toBulkGoalUnit(unit)).toEqual({
      kind: "character",
      unitId: "spaceRagnar",
      name: "Ragnar",
      owned: true,
      progression: "Legendary:RedThreeStars",
      rank: "Gold1",
      abilityLevels: [30, 28],
    })
  })

  it("starts an unowned character at its rarity and a Machine of War at Common", () => {
    const character: UnitTileUnit = {
      kind: "character",
      unitId: "adeptaMorvenn" as UnitId,
      name: "Morvenn",
      data: { state: "unowned", rarity: "Legendary" },
    }
    const mow: UnitTileUnit = {
      kind: "mow",
      unitId: "adeptaGalatian" as UnitId,
      name: "Galatian",
      data: { state: "unowned" },
    }
    expect(toBulkGoalUnit(character)).toMatchObject({
      owned: false,
      startProgression: "Legendary:RedThreeStars",
    })
    expect(toBulkGoalUnit(mow)).toMatchObject({
      owned: false,
      startProgression: "Common:None",
    })
  })
})
