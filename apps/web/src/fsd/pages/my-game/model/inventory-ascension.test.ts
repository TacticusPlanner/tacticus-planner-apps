import { describe, expect, it } from "vitest"
import type { Rarity } from "@workspace/game-domain"

import {
  allianceRarityCounts,
  componentCounts,
  ORB_RARITIES,
  rarityCounts,
  xpBooksView,
} from "./inventory-ascension"

const books = {
  Common: { id: "xp0", xp: 10 },
  Uncommon: { id: "xp1", xp: 50 },
  Rare: { id: "xp2", xp: 250 },
  Epic: { id: "xp3", xp: 1000 },
  Legendary: { id: "xp4", xp: 4000 },
  Mythic: { id: "xp5", xp: 12_000 },
} satisfies Record<Rarity, { id: string; xp: number }>

describe("rarityCounts", () => {
  it("lists every rarity Common first, adding up repeats and joining the goals' needs", () => {
    const counts = rarityCounts(
      [
        { rarity: "Epic", amount: 2 },
        { rarity: "Epic", amount: 3 },
      ],
      { Epic: { need: 8, short: 3 } }
    )
    expect(counts.map((entry) => entry.rarity)).toEqual([
      "Common",
      "Uncommon",
      "Rare",
      "Epic",
      "Legendary",
      "Mythic",
    ])
    expect(counts[3]?.count).toEqual({ have: 5, need: 8, short: 3 })
    expect(counts[0]?.count).toEqual({ have: 0, need: 0, short: 0 })
  })
})

describe("allianceRarityCounts and componentCounts", () => {
  it("read the lowercase inventory keys beside the capitalised need keys", () => {
    const rows = allianceRarityCounts(
      {
        imperial: [{ rarity: "Rare", amount: 4 }],
        xenos: [],
        chaos: [{ rarity: "Mythic", amount: 1 }],
      },
      { Chaos: { Mythic: { need: 2, short: 1 } } }
    )
    expect(rows.map((row) => row.alliance)).toEqual([
      "Imperial",
      "Xenos",
      "Chaos",
    ])
    expect(rows[0]?.cells[2]?.count.have).toBe(4)
    expect(rows[2]?.cells[5]?.count).toEqual({ have: 1, need: 2, short: 1 })
    expect(
      allianceRarityCounts(
        { imperial: [], xenos: [], chaos: [] },
        {},
        ORB_RARITIES
      )[0]?.cells.map((cell) => cell.rarity)
    ).toEqual(["Uncommon", "Rare", "Epic", "Legendary", "Mythic"])

    expect(
      componentCounts(
        { imperial: { amount: 7 }, xenos: { amount: 0 }, chaos: { amount: 2 } },
        { Xenos: { need: 5, short: 5 } }
      )
    ).toEqual([
      { alliance: "Imperial", count: { have: 7, need: 0, short: 0 } },
      { alliance: "Xenos", count: { have: 0, need: 5, short: 5 } },
      { alliance: "Chaos", count: { have: 2, need: 0, short: 0 } },
    ])
  })
})

describe("xpBooksView", () => {
  it("adds the books up to XP and prices what is short in the planned rarity, rounded up", () => {
    const view = xpBooksView({
      inventory: [
        { xpBookId: "xp0", amount: 3 },
        { xpBookId: "xp4", amount: 2 },
        { xpBookId: "unknown", amount: 9 },
      ],
      books,
      xpNeed: { need: 20_000, short: 9001 },
      bookRarity: "Legendary",
    })
    expect(view.books[0]).toEqual({ rarity: "Common", have: 3 })
    expect(view.totalXp).toBe(8030)
    expect(view.xp).toEqual({ have: 8030, need: 20_000, short: 9001 })
    expect(view.booksShort).toBe(3)
  })
})
