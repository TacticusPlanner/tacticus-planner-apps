import { describe, expect, it } from "vitest"

import { factionIdSchema, unitIdSchema } from "./game-ids"
import { factionOrder, factionRank, groupByFaction } from "./faction"

const factionId = (value: string) => factionIdSchema.parse(value)
const unitId = (value: string) => unitIdSchema.parse(value)

describe("factionRank", () => {
  it("ranks factions by their position in factionOrder", () => {
    expect(factionRank(factionId("Ultramarines"))).toBe(0)
    expect(factionRank(factionOrder[1]!)).toBe(1)
  })

  it("puts Adeptus Astartes last", () => {
    expect(factionRank(factionId("AdeptusAstartes"))).toBe(
      factionOrder.length - 1
    )
  })

  it("ranks an unrecognized faction id after every known one", () => {
    expect(factionRank(factionId("SomeNewFaction"))).toBe(factionOrder.length)
  })
})

describe("groupByFaction", () => {
  it("orders factions by the curated factionOrder", () => {
    const groups = groupByFaction(
      [
        {
          id: unitId("a"),
          name: "A",
          faction: factionId("AdeptusAstartes"),
        },
        { id: unitId("b"), name: "B", faction: factionId("Necrons") },
        { id: unitId("c"), name: "C", faction: factionId("Ultramarines") },
      ],
      (value) => value
    )

    expect(groups.map((group) => group.factionId)).toEqual([
      "Ultramarines",
      "Necrons",
      "AdeptusAstartes",
    ])
  })

  it("puts unrecognized faction ids after every known one", () => {
    const groups = groupByFaction(
      [
        {
          id: unitId("a"),
          name: "A",
          faction: factionId("SomeNewFaction"),
        },
        { id: unitId("b"), name: "B", faction: factionId("Necrons") },
      ],
      (value) => value
    )

    expect(groups.map((group) => group.factionId)).toEqual([
      "Necrons",
      "SomeNewFaction",
    ])
  })

  it("keeps members in catalog order", () => {
    const groups = groupByFaction(
      [
        { id: unitId("a"), name: "Zed", faction: factionId("Necrons") },
        { id: unitId("b"), name: "Amy", faction: factionId("Necrons") },
      ],
      (value) => value
    )

    expect(groups[0]?.members.map((member) => member.id)).toEqual(["a", "b"])
  })
})
