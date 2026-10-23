import { describe, expect, it } from "vitest"

import {
  unitPowerCatalog,
  unitPowerContextFixture,
} from "@/test/fixtures/unit-power"

import { buildUnitPowerContext } from "./unit-power-context"
import {
  characterPowerAt,
  characterStatsAt,
  mowPowerAt,
  npcPowerAt,
  rosterCharacterPower,
} from "./unit-power"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`expected an item at index ${index}`)
  return value
}

const context = unitPowerContextFixture()

const tiguriusGold1 = {
  unitId: "ultraTigurius",
  rank: "Gold1",
  progressionIndex: "Epic:RedOneStar",
  appliedUpgradeSlots: [0, 1, 2],
  abilities: [{ level: 20 }, { level: 15 }],
  equippedItems: [],
} as const

describe("rosterCharacterPower", () => {
  it("gives a synced Tigurius at Gold I 16,672", () => {
    expect(rosterCharacterPower(tiguriusGold1, context)).toBe(16_672)
  })

  it("counts equipped items and a repeated slot once", () => {
    expect(
      rosterCharacterPower(
        {
          ...tiguriusGold1,
          appliedUpgradeSlots: [0, 1, 2, 2],
          equippedItems: [{ equipmentId: "I_Crit_C001", level: 3 }],
        },
        context
      )
    ).toBe(16_809)
  })

  it("is 0 for a character the roster does not hold", () => {
    expect(rosterCharacterPower(undefined, context)).toBe(0)
  })

  it("is null for a unit or an item the catalog doesn't know", () => {
    expect(
      rosterCharacterPower({ ...tiguriusGold1, unitId: "newHero" }, context)
    ).toBeNull()
    expect(
      rosterCharacterPower(
        {
          ...tiguriusGold1,
          equippedItems: [{ equipmentId: "I_Unknown", level: 1 }],
        },
        context
      )
    ).toBeNull()
  })

  it("is null when the unit-power record has no entry for the unit", () => {
    const withoutTigurius = buildUnitPowerContext({
      ...unitPowerCatalog,
      unitPower: {
        ...unitPowerCatalog.unitPower,
        units: unitPowerCatalog.unitPower.units.filter(
          (unit) => unit.unitId !== "ultraTigurius"
        ),
      },
    })
    expect(rosterCharacterPower(tiguriusGold1, withoutTigurius!)).toBeNull()
  })
})

describe("characterStatsAt and characterPowerAt", () => {
  const values = {
    rank: "Adamantine2",
    progression: "Mythic:TwoBlueStars",
    appliedUpgradeSlots: [],
    activeAbilityLevel: 1,
    passiveAbilityLevel: 1,
  } as const

  it("gives Tigurius at Adamantine II 7,955 / 3,671 / 1,713", () => {
    expect(characterStatsAt("ultraTigurius", values, context)).toEqual({
      health: 7955,
      damage: 3671,
      armour: 1713,
    })
  })

  it("is null for an unknown character", () => {
    expect(characterStatsAt("newHero", values, context)).toBeNull()
    expect(characterPowerAt("newHero", values, context)).toBeNull()
  })
})

describe("mowPowerAt and npcPowerAt", () => {
  it("gives a maxed Biovore 1,040,687", () => {
    expect(
      mowPowerAt(
        "tyranBiovore",
        {
          progression: "Mythic:MythicWings",
          primaryAbilityLevel: 60,
          secondaryAbilityLevel: 60,
        },
        context
      )
    ).toBe(1_040_687)
  })

  it("gives the Infiltrator's third row 45", () => {
    const row = at(at(unitPowerCatalog.npcs, 0).stats, 2)
    expect(npcPowerAt("darkaNpc1Infiltrator", row, context)).toBe(45)
  })

  it("is null for an unknown MoW or NPC", () => {
    const mowValues = {
      progression: "Common:None",
      primaryAbilityLevel: 1,
      secondaryAbilityLevel: 1,
    } as const
    expect(mowPowerAt("newMow", mowValues, context)).toBeNull()
    expect(
      npcPowerAt(
        "newNpc",
        {
          health: 1,
          damage: 1,
          armour: 0,
          abilityLevel: 1,
          progressionIndex: 0,
        },
        context
      )
    ).toBeNull()
  })
})

describe("buildUnitPowerContext", () => {
  it("is null when the unit-power record is absent", () => {
    expect(
      buildUnitPowerContext({ ...unitPowerCatalog, unitPower: null })
    ).toBeNull()
  })
})
