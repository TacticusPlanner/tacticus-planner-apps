import { describe, expect, it } from "vitest"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"

import type { ReadState } from "@/shared/lib"
import { characterPowerAt, type UnitPowerContext } from "@/shared/unit-power"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import {
  characterPowerValues,
  characterPowerView,
  equippableItems,
  itemStatLines,
  ladderRanks,
  type PlayerCharacter,
  type ShownValues,
} from "./character-unit.view-model"

const character = {
  id: "ultraTigurius",
  faction: "Ultramarines",
  equipmentSlots: ["I_Crit", "I_Block"],
} as unknown as CharacterStorageModel

function item(
  id: string,
  overrides: Partial<EquipmentStorageModel>
): EquipmentStorageModel {
  return {
    id,
    name: id,
    rarity: "Common",
    type: "I_Crit",
    isRelic: false,
    isUniqueRelic: false,
    allowedUnits: [],
    allowedFactions: [],
    ...overrides,
  } as unknown as EquipmentStorageModel
}

describe("equippableItems", () => {
  it("lists the slot's items the faction may use, highest rarity first, then by name", () => {
    const items = equippableItems(character, [
      item("mythicKnife", { name: "Knife", rarity: "Mythic" }),
      item("bolter", {
        name: "Bolter",
        allowedFactions: ["Ultramarines"] as never,
      }),
      item("axe", { name: "Axe" }),
      item("orkChoppa", { name: "Choppa", allowedFactions: ["Orks"] as never }),
      item("shield", { name: "Shield", type: "I_Block" }),
    ])
    expect(items.get("I_Crit")?.map((entry) => entry.id)).toEqual([
      "mythicKnife",
      "axe",
      "bolter",
    ])
    expect(items.get("I_Block")?.map((entry) => entry.id)).toEqual(["shield"])
  })

  it("leaves out relics and items without a real name", () => {
    const items = equippableItems(character, [
      item("relic", {
        name: "Relic",
        isRelic: true,
        allowedUnits: ["ultraTigurius"] as never,
      }),
      item("I_Crit_C005", { name: "_I_Crit_C005" }),
    ])
    expect(items.get("I_Crit")).toEqual([])
  })
})

describe("itemStatLines", () => {
  it("gives each stat at level 1 and the last level, with chance stats as percentages", () => {
    const lines = itemStatLines(
      item("shield", {
        levels: [
          { stats: { blockChance: 20, blockDamage: 23 } },
          { stats: { blockChance: 20, blockDamage: 30 } },
        ],
      })
    )
    expect(lines).toEqual([
      { stat: "blockChance", percent: true, from: 20, to: 20 },
      { stat: "blockDamage", percent: false, from: 23, to: 30 },
    ])
  })

  it("is empty for an item without levels", () => {
    expect(itemStatLines(item("bare", { levels: [] }))).toEqual([])
  })
})

const context = unitPowerContextFixture()
const ready: ReadState<UnitPowerContext | null> = {
  status: "ready",
  data: context,
  retry: () => {},
}

// The spec's synced Tigurius: Gold I, Epic 1 red star, slots 0 to 2, abilities 20/15, a Combat
// Knife at level 3 and no relic.
const goldTigurius = {
  unitId: "ultraTigurius",
  progressionIndex: "Epic:RedOneStar",
  rank: "Gold1",
  appliedUpgradeSlots: [0, 1, 2],
  abilities: [
    { abilityId: "StormOfWrath", level: 20 },
    { abilityId: "PsychicFortress", level: 15 },
  ],
  equippedItems: [{ slotId: "crit", equipmentId: "I_Crit_C001", level: 3 }],
} as unknown as PlayerCharacter
const goldShown: ShownValues = { progression: "Epic:RedOneStar", rank: "Gold1" }

function viewAt(
  shown: ShownValues,
  player: PlayerCharacter | undefined,
  levels: [number, number],
  state: ReadState<UnitPowerContext | null> = ready,
  equippedRelic?: { id: string; level: number }
) {
  const values = characterPowerValues({
    shown,
    player,
    activeLevel: levels[0],
    passiveLevel: levels[1],
    equippedRelic,
  })
  return { values, view: characterPowerView("ultraTigurius", values, state) }
}

describe("characterPowerView", () => {
  it("gives the game's stats at Mythic, 2 blue stars, Adamantine II: Health 7,955", () => {
    const { view } = viewAt(
      { progression: "Mythic:TwoBlueStars", rank: "Adamantine2" },
      undefined,
      [58, 46]
    )
    expect(view.stats).toMatchObject({
      status: "ready",
      stats: { health: 7955, damage: 3671, armour: 1713 },
    })
  })

  it("counts the applied slots and equipped items of an owned unit at Your unit: power 16,809", () => {
    const { values, view } = viewAt(goldShown, goldTigurius, [20, 15])
    expect(values.appliedUpgradeSlots).toEqual([0, 1, 2])
    expect(view.power).toEqual({ status: "ready", value: 16_809 })
    expect(view.includesItems).toBe(true)
    // The stats count the applied slots but not the item: 1,786 / 768 / 332.
    expect(view.stats).toMatchObject({
      status: "ready",
      stats: { health: 1786, damage: 768, armour: 332 },
    })
    // Without the knife the same values give the spec's 16,672.
    expect(
      characterPowerAt("ultraTigurius", { ...values, items: [] }, context)
    ).toBe(16_672)
  })

  it("changes power, not stats, with the passive ability", () => {
    const at15 = viewAt(goldShown, goldTigurius, [20, 15]).view
    const at16 = viewAt(goldShown, goldTigurius, [20, 16]).view
    expect(at16.power).not.toEqual(at15.power)
    expect(at16.stats).toEqual(at15.stats)
  })

  it("drops the applied slots at a Custom rank other than the player's, keeping the items", () => {
    const { values, view } = viewAt(
      { progression: "Epic:RedOneStar", rank: "Gold2" },
      goldTigurius,
      [20, 15]
    )
    expect(values.appliedUpgradeSlots).toEqual([])
    expect(values.items).toEqual([{ equipmentId: "I_Crit_C001", level: 3 }])
    expect(view.includesItems).toBe(true)
    expect(view.power).toEqual({
      status: "ready",
      value: characterPowerAt(
        "ultraTigurius",
        {
          rank: "Gold2",
          progression: "Epic:RedOneStar",
          appliedUpgradeSlots: [],
          activeAbilityLevel: 20,
          passiveAbilityLevel: 15,
          items: [{ equipmentId: "I_Crit_C001", level: 3 }],
        },
        context
      ),
    })
  })

  it("computes a unit that isn't owned at its starting values with no slots or items", () => {
    const { values, view } = viewAt(
      { progression: "Uncommon:TwoStars", rank: "Stone1" },
      undefined,
      [1, 1]
    )
    expect(values).toMatchObject({ appliedUpgradeSlots: [], items: [] })
    expect(view.includesItems).toBe(false)
    expect(view.power).toEqual({
      status: "ready",
      value: characterPowerAt("ultraTigurius", values, context),
    })
  })

  it("counts the equipped relic at the Relic panel's level", () => {
    const withRelic = {
      ...goldTigurius,
      equippedItems: [
        { slotId: "relic", equipmentId: "R_Crit_RelicBoltPistol", level: 3 },
      ],
    } as unknown as PlayerCharacter
    const { values } = viewAt(goldShown, withRelic, [20, 15], ready, {
      id: "R_Crit_RelicBoltPistol",
      level: 5,
    })
    expect(values.items).toEqual([
      { equipmentId: "R_Crit_RelicBoltPistol", level: 5 },
    ])
  })

  it("counts the applied slots only at the shown rank in Stats by rank", () => {
    const { view } = viewAt(goldShown, goldTigurius, [20, 15])
    if (view.stats.status !== "ready") throw new Error("stats not ready")
    expect(view.stats.byRank).toHaveLength(ladderRanks.length)
    expect(view.stats.byRank[ladderRanks.indexOf("Gold1")]).toEqual(
      view.stats.stats
    )
    // Silver III counts none of its own slots: below Gold I with its slots.
    const silver3 = view.stats.byRank[ladderRanks.indexOf("Silver3")]
    expect(silver3.health).toBeLessThan(view.stats.stats.health)
  })

  it("is a placeholder while loading and unavailable when the dataset is absent or failed", () => {
    const loading = viewAt(goldShown, goldTigurius, [20, 15], {
      status: "loading",
      retry: () => {},
    }).view
    expect(loading.power).toEqual({ status: "loading" })
    expect(loading.stats).toEqual({ status: "loading" })
    for (const state of [
      { status: "error", retry: () => {} },
      { status: "ready", data: null, retry: () => {} },
    ] as const) {
      const { view } = viewAt(goldShown, goldTigurius, [20, 15], state)
      expect(view.power).toEqual({ status: "unavailable" })
      expect(view.stats).toEqual({ status: "unavailable" })
    }
  })
})
