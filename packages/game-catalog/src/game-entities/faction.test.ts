import { describe, expect, it } from "vitest"

import { factionOrder, factionRank, groupByFaction } from "./faction"

describe("factionRank", () => {
  it("ranks factions by their position in factionOrder", () => {
    expect(factionRank("Ultramarines")).toBe(0)
    expect(factionRank(factionOrder[1]!)).toBe(1)
  })

  it("puts Adeptus Astartes last", () => {
    expect(factionRank("AdeptusAstartes")).toBe(factionOrder.length - 1)
  })

  it("ranks an unrecognized faction id after every known one", () => {
    expect(factionRank("SomeNewFaction")).toBe(factionOrder.length)
  })
})

describe("groupByFaction", () => {
  it("orders factions by the curated factionOrder, with Adeptus Astartes last", () => {
    const groups = groupByFaction(
      [
        { id: "a", name: "A", faction: "AdeptusAstartes" },
        { id: "b", name: "B", faction: "Necrons" },
        { id: "c", name: "C", faction: "Ultramarines" },
      ],
      (factionId) => factionId
    )

    expect(groups.map((g) => g.factionId)).toEqual([
      "Ultramarines",
      "Necrons",
      "AdeptusAstartes",
    ])
  })

  it("puts unrecognized faction ids after every known one", () => {
    const groups = groupByFaction(
      [
        { id: "a", name: "A", faction: "SomeNewFaction" },
        { id: "b", name: "B", faction: "Necrons" },
      ],
      (factionId) => factionId
    )

    expect(groups.map((g) => g.factionId)).toEqual([
      "Necrons",
      "SomeNewFaction",
    ])
  })

  it("keeps members within a faction in the order the game catalog returned them", () => {
    const groups = groupByFaction(
      [
        { id: "a", name: "Zed", faction: "Necrons" },
        { id: "b", name: "Amy", faction: "Necrons" },
      ],
      (factionId) => factionId
    )

    expect(groups[0]?.members.map((m) => m.id)).toEqual(["a", "b"])
  })
})
