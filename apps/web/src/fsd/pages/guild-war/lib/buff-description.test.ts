import { describe, expect, it } from "vitest"
import { guildWarFixture } from "@workspace/game-catalog/testing"

import { required } from "@/shared/lib"

import { fillBuffDescription } from "./buff-description"

const seasonA = required(guildWarFixture[0], "season A")

describe("fillBuffDescription", () => {
  it("fills a value the game keeps the same at every level", () => {
    expect(
      fillBuffDescription(
        "{[extraArmorPct]}% Armour and {[extraDmgPct]}% Damage.",
        seasonA,
        "EnvFortified_Local",
        undefined
      )
    ).toBe("10% Armour and 10% Damage.")
  })

  it("shows the range of a value that changes by level", () => {
    expect(
      fillBuffDescription(
        "{[extraArmorPct]}% increased Armour.",
        seasonA,
        "EnvArmourSupplies_Regional",
        "Legendary"
      )
    ).toBe("10–15% increased Armour.")
  })

  it("takes the ability of the defenders' rarity when the game keys them by rarity", () => {
    expect(
      fillBuffDescription(
        "Level {[summonAbilityLevel]}",
        seasonA,
        "EnvGarrison_Global",
        "Uncommon"
      )
    ).toBe("Level 9")
    expect(
      fillBuffDescription(
        "Level {[summonAbilityLevel]}",
        seasonA,
        "EnvGarrison_Global",
        "Common"
      )
    ).toBe("Level 4")
  })

  it("marks a slot with no value and has nothing without a description", () => {
    expect(
      fillBuffDescription(
        "{[unknown]}%",
        seasonA,
        "EnvFortified_Local",
        undefined
      )
    ).toBe("?%")
    expect(
      fillBuffDescription("", seasonA, "EnvFortified_Local", undefined)
    ).toBeUndefined()
  })
})
