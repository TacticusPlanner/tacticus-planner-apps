import { describe, expect, it } from "vitest"

import { testCatalogCharacter, testItem } from "./items-fixtures"
import { buildOwnedItems, openSlotCount } from "./owned-items"

const knife = testItem("I_Crit_E002", { rarity: "Epic" })
const shield = testItem("I_Block_R002", { type: "I_Block" })
const catalogItems = new Map([knife, shield].map((item) => [item.id, item]))
const catalogCharacters = new Map([
  [
    "ultraTitus",
    testCatalogCharacter(
      "ultraTitus",
      ["I_Crit", "I_Block", "I_Defensive"],
      [knife.id, shield.id]
    ),
  ],
])

describe("buildOwnedItems", () => {
  it("joins spares and worn copies per item and level, highest level first", () => {
    const owned = buildOwnedItems({
      catalogItems,
      catalogCharacters,
      syncedCharacters: [
        {
          unitId: "ultraTitus",
          progressionIndex: "Epic:RedOneStar",
          equippedItems: [{ slotId: "Slot1", equipmentId: knife.id, level: 5 }],
        },
      ],
      inventory: [
        { itemId: knife.id, level: 1, amount: 3 },
        { itemId: knife.id, level: 5, amount: 1 },
        { itemId: shield.id, level: 2, amount: 0 },
        { itemId: "I_Retired", level: 1, amount: 2 },
      ],
    })

    expect(owned.pieces).toHaveLength(1)
    const [piece] = owned.pieces
    expect(piece?.item.id).toBe(knife.id)
    expect(piece?.spare).toBe(4)
    expect(piece?.worn).toBe(1)
    expect(piece?.levels).toEqual([
      { level: 5, spare: 1, wearers: ["ultraTitus"] },
      { level: 1, spare: 3, wearers: [] },
    ])
    expect(owned.unknownCopies).toBe(2)
    expect(owned.characters[0]).toMatchObject({
      id: "ultraTitus",
      rarity: "Epic",
      worn: [{ slotIndex: 0, itemId: knife.id, level: 5 }],
    })
  })

  it("sorts by slot type, then rarity", () => {
    const owned = buildOwnedItems({
      catalogItems,
      catalogCharacters,
      syncedCharacters: [],
      inventory: [
        { itemId: shield.id, level: 1, amount: 1 },
        { itemId: knife.id, level: 1, amount: 1 },
      ],
    })
    expect(owned.pieces.map((piece) => piece.item.id)).toEqual([
      knife.id,
      shield.id,
    ])
  })
})

describe("openSlotCount", () => {
  it("opens the third slot at Rare 4 stars", () => {
    expect(openSlotCount("Uncommon:FourStars", 3)).toBe(2)
    expect(openSlotCount("Rare:FourStars", 3)).toBe(3)
  })
})
