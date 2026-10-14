import { describe, expect, it } from "vitest"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"

import { equippableItems, itemStatLines } from "./character-unit.view-model"

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
