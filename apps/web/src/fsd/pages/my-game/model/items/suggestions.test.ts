import { describe, expect, it } from "vitest"

import { testItem, testOwnedCharacter } from "./items-fixtures"
import type { CatalogItem, OwnedCharacter, OwnedItems } from "./owned-items"
import { compareCopies, suggestItems, suggestedCopies } from "./suggestions"

/** Spare stacks as [item, level, count]. */
type Stack = [CatalogItem, number, number]

function owned(characters: OwnedCharacter[], stacks: Stack[]): OwnedItems {
  const pieces = new Map<string, OwnedItems["pieces"][number]>()
  for (const [item, level, spare] of stacks) {
    const piece = pieces.get(item.id) ?? { item, levels: [], spare: 0, worn: 0 }
    piece.levels.push({ level, spare, wearers: [] })
    piece.spare += spare
    pieces.set(item.id, piece)
  }
  return { pieces: [...pieces.values()], characters, unknownCopies: 0 }
}

const run = (
  characters: OwnedCharacter[],
  stacks: Stack[],
  extra: CatalogItem[] = []
) => {
  const items = new Map([...ALL_ITEMS, ...extra].map((item) => [item.id, item]))
  return suggestItems(owned(characters, stacks), items)
}

const epicCrit = testItem("epicCrit", { rarity: "Epic", chance: 25 })
const rareCrit = testItem("rareCrit", { rarity: "Rare", chance: 35 })
const rareCrit20 = testItem("rareCrit20", { rarity: "Rare", chance: 20 })
const legendaryCrit = testItem("legendaryCrit", { rarity: "Legendary" })
const mythicCrit = testItem("mythicCrit", { rarity: "Mythic" })
const rareArmour = testItem("rareArmour", { type: "I_Defensive" })
const rareArmour2 = testItem("rareArmour2", { type: "I_Defensive" })
const uncommonArmour = testItem("uncommonArmour", {
  type: "I_Defensive",
  rarity: "Uncommon",
})
const critBooster = testItem("critBooster", { type: "I_Booster_Crit" })
const relic = testItem("relic", {
  rarity: "Mythic",
  isRelic: true,
  allowedUnits: ["titus", "calgar", "tigurius"],
})

const ALL_ITEMS = [
  epicCrit,
  rareCrit,
  rareCrit20,
  legendaryCrit,
  mythicCrit,
  rareArmour,
  rareArmour2,
  uncommonArmour,
  critBooster,
  relic,
]

/** A character whose each slot may take the test items of that slot's type, as the catalog's
 *  eligible lists do. */
const typed = (
  id: string,
  slots: string[],
  options: Parameters<typeof testOwnedCharacter>[3] = {}
): OwnedCharacter => ({
  ...testOwnedCharacter(id, slots, [], options),
  eligible: slots.map(
    (slot) =>
      new Set(
        ALL_ITEMS.filter((item) => item.type === slot).map((item) => item.id)
      )
  ),
})

const crits = [
  "epicCrit",
  "rareCrit",
  "rareCrit20",
  "legendaryCrit",
  "mythicCrit",
  "relic",
]
const hero = (
  id: string,
  options: Parameters<typeof testOwnedCharacter>[3] = {}
) => testOwnedCharacter(id, ["I_Crit"], crits, options)

const worn = (itemId: string, level: number) =>
  hero("titus", { worn: [{ slotIndex: 0, itemId, level }] })
const reason = (character: OwnedCharacter, stacks: Stack[]) =>
  run([character], stacks).characters[0]?.suggestions[0]?.reason
const itemOf = (id: string) => ALL_ITEMS.find((item) => item.id === id)

describe("suggestItems", () => {
  it("fills an empty slot with the best spare: rarity before level", () => {
    const result = run(
      [hero("titus")],
      [
        [rareCrit, 10, 1],
        [epicCrit, 1, 1],
      ]
    )
    expect(result.characters).toEqual([
      {
        characterId: "titus",
        faction: "Ultramarines",
        rarity: "Legendary",
        suggestions: [
          expect.objectContaining({
            slotIndex: 0,
            locked: false,
            next: { itemId: "epicCrit", level: 1 },
            reason: { kind: "empty" },
          }),
        ],
      },
    ])
  })

  it("leaves a slot alone while it holds an item the catalog doesn't know", () => {
    const character = hero("titus", {
      worn: [{ slotIndex: 0, itemId: "newCrit", level: 1, unknown: true }],
    })
    expect(run([character], [[epicCrit, 1, 1]]).characters).toEqual([])
  })

  it("swaps in a higher rarity, a higher level, or a higher chance, and says why", () => {
    expect(reason(worn("rareCrit", 5), [[epicCrit, 1, 1]])).toEqual({
      kind: "rarity",
      from: "Rare",
      to: "Epic",
    })
    expect(reason(worn("rareCrit", 3), [[rareCrit20, 5, 1]])).toEqual({
      kind: "level",
      from: 3,
      to: 5,
    })
    expect(reason(worn("rareCrit20", 3), [[rareCrit, 3, 1]])).toEqual({
      kind: "chance",
      from: 20,
      to: 35,
    })
    expect(reason(worn("rareCrit", 3), [[rareCrit20, 3, 1]])).toBeUndefined()
  })

  it("never swaps Defensive items at the same rarity and level", () => {
    const character = typed("titus", ["I_Defensive"], {
      worn: [{ slotIndex: 0, itemId: "rareArmour", level: 3 }],
    })
    expect(
      run([character], [[rareArmour2, 3, 1]], [rareArmour]).characters
    ).toEqual([])
    expect(
      run([character], [[rareArmour2, 4, 1]], [rareArmour]).characters[0]
        ?.suggestions[0]?.reason
    ).toEqual({ kind: "level", from: 3, to: 4 })
  })

  it("leaves a worn Mythic item and skips items above the character's rarity", () => {
    const mythicHero = hero("titus", {
      progression: "Mythic:OneBlueStar",
      worn: [{ slotIndex: 0, itemId: "mythicCrit", level: 1 }],
    })
    expect(run([mythicHero], [[mythicCrit, 10, 1]]).characters).toEqual([])
    const epicHero = hero("calgar", { progression: "Epic:RedOneStar" })
    expect(
      run(
        [epicHero],
        [
          [legendaryCrit, 1, 1],
          [rareCrit, 2, 1],
        ]
      ).characters[0]?.suggestions[0]?.next
    ).toEqual({ itemId: "rareCrit", level: 2 })
  })

  it("fills a booster only once its base slot is worn or suggested", () => {
    const character = typed("titus", ["I_Booster_Crit", "I_Crit"])
    expect(run([character], [[critBooster, 1, 1]]).characters).toEqual([])
    const both = run(
      [character],
      [
        [critBooster, 1, 1],
        [rareCrit, 1, 1],
      ]
    ).characters[0]?.suggestions
    expect(both?.map((s) => s.next.itemId)).toEqual(["critBooster", "rareCrit"])
  })

  it("shares one pool of spares: the most progressed character picks first", () => {
    const result = run(
      [
        hero("rookie", { progression: "Rare:FourStars" }),
        hero("veteran", { progression: "Legendary:RedFiveStars" }),
      ],
      [
        [epicCrit, 1, 1],
        [rareCrit, 1, 1],
      ]
    )
    expect(
      result.characters.map((c) => [
        c.characterId,
        c.suggestions[0]?.next.itemId,
      ])
    ).toEqual([
      ["veteran", "epicCrit"],
      ["rookie", "rareCrit"],
    ])
  })

  it("plans a slot that isn't open yet last, and marks it locked", () => {
    const slots = ["I_Crit", "I_Defensive", "I_Defensive"]
    const young = typed("young", slots, { progression: "Rare:FourStars" })
    const younger = typed("younger", slots, {
      progression: "Uncommon:FourStars",
    })
    // Three spare armours fill every open Defensive slot; the younger character's third slot
    // (not open below Rare 4 stars) only gets a fourth.
    const result = run([young, younger], [[uncommonArmour, 1, 3]])
    const plan = Object.fromEntries(
      result.characters.map((c) => [
        c.characterId,
        c.suggestions.map((s) => [s.slotIndex, s.locked]),
      ])
    )
    expect(plan).toEqual({
      young: [
        [1, false],
        [2, false],
      ],
      younger: [[1, false]],
    })
    const more = run([young, younger], [[uncommonArmour, 1, 4]])
    expect(
      more.characters[1]?.suggestions.map((s) => [s.slotIndex, s.locked])
    ).toEqual([
      [1, false],
      [2, true],
    ])
  })

  it("never puts a relic in a slot, and lists spare relics with who could wear them", () => {
    const result = run(
      [
        hero("titus", { progression: "Mythic:OneBlueStar" }),
        hero("calgar", { progression: "Legendary:RedFiveStars" }),
      ],
      [[relic, 4, 1]]
    )
    expect(result.characters).toEqual([])
    expect(result.relics).toEqual([
      {
        item: relic,
        copies: [{ level: 4, spare: 1 }],
        wearers: [
          { characterId: "titus", status: "ready" },
          { characterId: "calgar", status: "needsMythic" },
          { characterId: "tigurius", status: "notOwned" },
        ],
      },
    ])
  })

  it("counts the copies it hands out, for Reclaim to keep", () => {
    const result = run([hero("titus"), hero("calgar")], [[rareCrit, 2, 3]])
    expect(suggestedCopies(result)).toEqual(
      new Map([["rareCrit", new Map([[2, 2]])]])
    )
  })
})

describe("compareCopies", () => {
  it("ranks by rarity, then level, then chance", () => {
    const ranked = [
      { itemId: "rareCrit20", level: 5 },
      { itemId: "rareCrit", level: 5 },
      { itemId: "epicCrit", level: 1 },
      { itemId: "rareCrit", level: 9 },
    ].toSorted((a, b) => compareCopies(a, b, itemOf))
    expect(ranked).toEqual([
      { itemId: "epicCrit", level: 1 },
      { itemId: "rareCrit", level: 9 },
      { itemId: "rareCrit", level: 5 },
      { itemId: "rareCrit20", level: 5 },
    ])
  })
})
