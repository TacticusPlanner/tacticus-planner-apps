import { describe, expect, it } from "vitest"

import {
  testCatalogCharacter,
  testItem,
  testOwnedCharacter,
} from "./items-fixtures"
import type {
  CatalogCharacter,
  CatalogItem,
  OwnedCharacter,
  OwnedItems,
} from "./owned-items"
import { planReclaim } from "./reclaim"

const rareCrit = testItem("rareCrit", { rarity: "Rare" })
const epicCrit = testItem("epicCrit", { rarity: "Epic" })
const mythicCrit = testItem("mythicCrit", { rarity: "Mythic" })
const relic = testItem("relic", { rarity: "Mythic", isRelic: true })
const ITEMS = [rareCrit, epicCrit, mythicCrit, relic]
const CRITS = ITEMS.map((item) => item.id)

/** Spare stacks as [item, level, count]. */
type Stack = [CatalogItem, number, number]

function plan({
  stacks,
  catalog,
  owned = [],
  reserved = new Map(),
}: {
  stacks: Stack[]
  catalog: CatalogCharacter[]
  owned?: OwnedCharacter[]
  reserved?: Map<string, Map<number, number>>
}) {
  const pieces = new Map<string, OwnedItems["pieces"][number]>()
  for (const [item, level, spare] of stacks) {
    const piece = pieces.get(item.id) ?? { item, levels: [], spare: 0, worn: 0 }
    piece.levels.push({ level, spare, wearers: [] })
    piece.levels.sort((a, b) => b.level - a.level)
    piece.spare += spare
    pieces.set(item.id, piece)
  }
  return planReclaim({
    owned: {
      pieces: [...pieces.values()],
      characters: owned,
      unknownCopies: 0,
    },
    catalogCharacters: new Map(catalog.map((c) => [c.id, c])),
    itemsById: new Map(ITEMS.map((item) => [item.id, item])),
    reserved,
  })
}

const critHero = (id: string) => testCatalogCharacter(id, ["I_Crit"], CRITS)
const wearing = (id: string, itemId: string) =>
  testOwnedCharacter(id, ["I_Crit"], CRITS, {
    worn: [{ slotIndex: 0, itemId, level: 1 }],
  })
const summary = (result: ReturnType<typeof plan>) =>
  result.stacks.map((s) => [s.item.id, s.level, s.safe, s.reason.kind])

describe("planReclaim", () => {
  it("marks the copies beyond the slots that could use one as safe", () => {
    const result = plan({
      stacks: [[rareCrit, 1, 8]],
      catalog: [critHero("a"), critHero("b"), critHero("c")],
      owned: [testOwnedCharacter("a", ["I_Crit"], CRITS)],
    })
    expect(result.stacks[0]).toMatchObject({
      safe: 5,
      reason: { kind: "surplus", held: 8, users: 3 },
    })
  })

  it("counts characters not owned yet, and slots that aren't open yet", () => {
    const young = testCatalogCharacter(
      "young",
      ["I_Defensive", "I_Defensive", "I_Crit"],
      []
    )
    young.eligibleEquipment = [
      { slot: "I_Defensive", equipmentIds: [] },
      { slot: "I_Defensive", equipmentIds: [] },
      { slot: "I_Crit", equipmentIds: CRITS },
    ]
    const result = plan({
      stacks: [[rareCrit, 1, 3]],
      catalog: [critHero("unowned"), young],
      owned: [
        testOwnedCharacter(
          "young",
          ["I_Defensive", "I_Defensive", "I_Crit"],
          [],
          {
            progression: "Uncommon:FourStars",
          }
        ),
      ],
    })
    expect(result.stacks[0]?.safe).toBe(1)
  })

  it("marks every copy safe when everyone who can use it wears that rarity or better", () => {
    const result = plan({
      stacks: [[rareCrit, 1, 2]],
      catalog: [critHero("a"), critHero("b")],
      owned: [wearing("a", "epicCrit"), wearing("b", "rareCrit")],
    })
    expect(summary(result)).toEqual([["rareCrit", 1, 2, "covered"]])
  })

  it("keeps the highest-level copies", () => {
    const result = plan({
      stacks: [
        [epicCrit, 1, 3],
        [epicCrit, 5, 1],
      ],
      catalog: [critHero("a"), critHero("b")],
    })
    expect(summary(result)).toEqual([
      ["epicCrit", 5, 0, "surplus"],
      ["epicCrit", 1, 2, "surplus"],
    ])
  })

  it("keeps the copies Suggestions hands out", () => {
    const result = plan({
      stacks: [[rareCrit, 2, 3]],
      catalog: [critHero("a")],
      reserved: new Map([["rareCrit", new Map([[2, 1]])]]),
    })
    expect(result.stacks[0]).toMatchObject({
      safe: 1,
      reserved: 1,
      reason: { kind: "surplus", held: 2, users: 1 },
    })
  })

  it("never marks relics or Mythic items safe", () => {
    const result = plan({
      stacks: [
        [relic, 1, 2],
        [mythicCrit, 3, 4],
      ],
      catalog: [],
    })
    expect(summary(result)).toEqual([
      ["mythicCrit", 3, 0, "mythic"],
      ["relic", 1, 0, "relic"],
    ])
  })

  it("adds up what the safe copies and all spares return", () => {
    // Each test level costs 10 salvage, and 100 gold above level 1: a Lv 3 copy returns 30 and 200.
    const result = plan({
      stacks: [
        [rareCrit, 3, 2],
        [epicCrit, 1, 1],
      ],
      catalog: [critHero("a")],
      owned: [wearing("a", "epicCrit")],
    })
    expect(result.safe).toEqual({
      copies: 3,
      value: { salvage: 70, gold: 400, mythicSalvage: 0 },
    })
    expect(result.all.copies).toBe(3)
  })

  it("pays an Epic Lv 3 copy's 360 salvage and 1,750 coins back, as the game does", () => {
    const knife: CatalogItem = {
      ...testItem("epicKnife", { rarity: "Epic", levels: 3 }),
      upgradeLevels: [
        { goldCost: 0, salvageCost: 150, mythicSalvageCost: 0 },
        { goldCost: 750, salvageCost: 90, mythicSalvageCost: 0 },
        { goldCost: 1000, salvageCost: 120, mythicSalvageCost: 0 },
      ],
    }
    const result = plan({ stacks: [[knife, 3, 1]], catalog: [] })
    expect(result.safe.value).toEqual({
      salvage: 360,
      gold: 1750,
      mythicSalvage: 0,
    })
  })
})
