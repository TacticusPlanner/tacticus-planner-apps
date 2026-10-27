import { describe, expect, it } from "vitest"
import { progressionRulesFixture } from "@workspace/game-catalog/testing"

import type { ReadState } from "@/shared/lib"
import type { UnitPowerContext } from "@/shared/unit-power"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import {
  mowPowerFigure,
  mythicLevel,
  toMythicLevels,
} from "./mow-unit.view-model"

describe("mythicLevel", () => {
  const levels = toMythicLevels([progressionRulesFixture])

  it("follows the blue stars, 1 to 4", () => {
    expect(mythicLevel("Mythic:OneBlueStar", levels)).toBe(1)
    expect(mythicLevel("Mythic:TwoBlueStars", levels)).toBe(2)
    expect(mythicLevel("Mythic:ThreeBlueStars", levels)).toBe(3)
    expect(mythicLevel("Mythic:MythicWings", levels)).toBe(4)
    expect(levels.size).toBe(4)
  })

  it("is not unlocked below Mythic", () => {
    expect(mythicLevel("Legendary:RedFiveStars", levels)).toBeUndefined()
    expect(mythicLevel("Common:None", levels)).toBeUndefined()
  })
})

describe("mowPowerFigure", () => {
  const ready: ReadState<UnitPowerContext | null> = {
    status: "ready",
    data: unitPowerContextFixture(),
    retry: () => {},
  }
  const maxed = { primary: 60, secondary: 60 }

  it("is V1's 1,040,687 for a maxed Biovore at Mythic Wings", () => {
    expect(
      mowPowerFigure("tyranBiovore", "Mythic:MythicWings", maxed, ready)
    ).toEqual({ status: "ready", value: 1_040_687 })
  })

  it("drops to 873,548 at Mythic, 1 blue star with the same ability levels", () => {
    expect(
      mowPowerFigure("tyranBiovore", "Mythic:OneBlueStar", maxed, ready)
    ).toEqual({ status: "ready", value: 873_548 })
  })

  it("is loading while the player record is still read, whatever the power data", () => {
    expect(
      mowPowerFigure("tyranBiovore", "Common:None", maxed, ready, true)
    ).toEqual({ status: "loading" })
  })

  it("is unavailable when the dataset failed, is absent or has no entry for the MoW", () => {
    const failed = { status: "error", retry: () => {} } as const
    const absent = { status: "ready", data: null, retry: () => {} } as const
    expect(
      mowPowerFigure("tyranBiovore", "Mythic:MythicWings", maxed, failed)
    ).toEqual({ status: "unavailable" })
    expect(
      mowPowerFigure("tyranBiovore", "Mythic:MythicWings", maxed, absent)
    ).toEqual({ status: "unavailable" })
    expect(
      mowPowerFigure("notAMow", "Mythic:MythicWings", maxed, ready)
    ).toEqual({ status: "unavailable" })
  })

  it("is a placeholder while loading", () => {
    expect(
      mowPowerFigure("tyranBiovore", "Mythic:MythicWings", maxed, {
        status: "loading",
        retry: () => {},
      })
    ).toEqual({ status: "loading" })
  })
})
