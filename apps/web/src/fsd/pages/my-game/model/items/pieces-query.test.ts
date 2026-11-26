import { describe, expect, it } from "vitest"

import { testItem } from "./items-fixtures"
import type { CatalogItem, OwnedPiece } from "./owned-items"
import {
  DEFAULT_PIECES_QUERY,
  activePiecesFilterCount,
  filterPieces,
  groupPieces,
  itemFactions,
  piecesQueryNarrows,
  readPiecesQuery,
  writePiecesQuery,
} from "./pieces-query"
import type { PiecesCharacterIndex } from "./pieces-query"

const piece = (item: CatalogItem, spare = 0, worn = 0): OwnedPiece => ({
  item,
  levels: [
    { level: 1, spare, wearers: Array.from({ length: worn }, () => "x") },
  ],
  spare,
  worn,
})

const characters: PiecesCharacterIndex = new Map([
  [
    "ultraTitus",
    { faction: "Ultramarines", eligible: new Set(["crit", "relic"]) },
  ],
  ["orksWarboss", { faction: "Orks", eligible: new Set(["block"]) }],
])

const crit = testItem("crit", {
  name: "Power Sword",
  rarity: "Epic",
  allowedFactions: ["Ultramarines", "Orks"],
})
const block = testItem("block", {
  name: "Storm Shield",
  type: "I_Block",
  rarity: "Legendary",
  allowedFactions: ["Orks"],
})
const relic = testItem("relic", {
  name: "Relic Blade",
  rarity: "Mythic",
  isRelic: true,
  allowedUnits: ["ultraTitus"],
})
const pieces = [piece(crit, 2), piece(block, 0, 1), piece(relic, 1)]

const filter = (patch: Partial<typeof DEFAULT_PIECES_QUERY>) =>
  filterPieces(
    pieces,
    { ...DEFAULT_PIECES_QUERY, ...patch },
    {
      nameOf: (item) => item.name,
      characters,
      locale: "en",
    }
  ).map(({ item }) => item.id)

describe("readPiecesQuery / writePiecesQuery", () => {
  it("reads the defaults from an empty URL", () => {
    expect(readPiecesQuery(new URLSearchParams())).toEqual(DEFAULT_PIECES_QUERY)
  })

  it("round-trips a query and leaves defaults and other parameters out", () => {
    const params = writePiecesQuery(new URLSearchParams("tour=1"), {
      q: "sword",
      rarity: ["Epic", "Mythic"],
      slot: ["I_Crit"],
      spares: true,
      relic: false,
      layout: "cards",
      group: "rarity",
      piece: "crit",
    })
    expect(params.toString()).toBe(
      "tour=1&q=sword&rarity=Epic%2CMythic&slot=I_Crit&spares=1&group=rarity&piece=crit"
    )
    expect(readPiecesQuery(params)).toEqual({
      ...DEFAULT_PIECES_QUERY,
      q: "sword",
      rarity: ["Epic", "Mythic"],
      slot: ["I_Crit"],
      spares: true,
      group: "rarity",
      piece: "crit",
    })
    expect(writePiecesQuery(params, { piece: null }).has("piece")).toBe(false)
  })

  it("drops values it doesn't know", () => {
    expect(
      readPiecesQuery(
        new URLSearchParams("rarity=Epic,Shiny&slot=I_Hat&layout=list&group=x")
      )
    ).toEqual({ ...DEFAULT_PIECES_QUERY, rarity: ["Epic"] })
  })
})

describe("filter counts", () => {
  it("counts the panel's filters, and narrows on search and chips too", () => {
    const query = {
      ...DEFAULT_PIECES_QUERY,
      rarity: ["Epic" as const],
      faction: ["Orks"],
    }
    expect(activePiecesFilterCount(query)).toBe(2)
    expect(piecesQueryNarrows(DEFAULT_PIECES_QUERY)).toBe(false)
    expect(piecesQueryNarrows({ ...DEFAULT_PIECES_QUERY, spares: true })).toBe(
      true
    )
    expect(piecesQueryNarrows({ ...DEFAULT_PIECES_QUERY, q: "  " })).toBe(false)
  })
})

describe("itemFactions", () => {
  it("takes the item's factions, or those of the characters a relic is for", () => {
    expect(itemFactions(block, characters)).toEqual(["Orks"])
    expect(itemFactions(relic, characters)).toEqual(["Ultramarines"])
  })
})

describe("filterPieces", () => {
  it("matches the displayed name, ignoring case", () => {
    expect(filter({ q: "SHIELD" })).toEqual(["block"])
  })

  it("keeps spares only and relics only", () => {
    expect(filter({ spares: true })).toEqual(["crit", "relic"])
    expect(filter({ relic: true })).toEqual(["relic"])
  })

  it("filters by rarity, slot, faction and character", () => {
    expect(filter({ rarity: ["Legendary", "Mythic"] })).toEqual([
      "block",
      "relic",
    ])
    expect(filter({ slot: ["I_Block"] })).toEqual(["block"])
    expect(filter({ faction: ["Ultramarines"] })).toEqual(["crit", "relic"])
    expect(filter({ character: ["orksWarboss"] })).toEqual(["block"])
  })
})

describe("groupPieces", () => {
  it("groups by slot in slot order and by rarity highest first", () => {
    expect(groupPieces(pieces, "slot").map((group) => group.key)).toEqual([
      "I_Crit",
      "I_Block",
    ])
    expect(groupPieces(pieces, "rarity").map((group) => group.key)).toEqual([
      "Mythic",
      "Legendary",
      "Epic",
    ])
    expect(groupPieces(pieces, "none")).toEqual([{ key: "all", pieces }])
    expect(groupPieces([], "none")).toEqual([])
  })
})
