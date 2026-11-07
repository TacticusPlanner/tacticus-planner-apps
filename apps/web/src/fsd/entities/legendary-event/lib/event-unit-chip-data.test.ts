import { describe, expect, it } from "vitest"

import { eventUnitChipData, supportTraitsOf } from "./event-unit-chip-data"

describe("supportTraitsOf", () => {
  it("keeps only Healer and Mechanic, in that order", () => {
    expect(supportTraitsOf(["Mechanic", "Flying", "Healer"])).toEqual([
      "Healer",
      "Mechanic",
    ])
    expect(supportTraitsOf(["Flying"])).toEqual([])
  })
})

describe("eventUnitChipData", () => {
  it("carries the support traits for an unowned unit and for unknown ownership", () => {
    expect(eventUnitChipData("x", new Map(), ["Healer"])).toEqual({
      unitId: "x",
      owned: false,
      supportTraits: ["Healer"],
    })
    expect(eventUnitChipData("x", undefined, ["Mechanic"])).toEqual({
      unitId: "x",
      owned: undefined,
      supportTraits: ["Mechanic"],
    })
  })

  it("leaves supportTraits out when the unit has none or no traits are given", () => {
    expect(eventUnitChipData("x", new Map(), ["Flying"])).toEqual({
      unitId: "x",
      owned: false,
    })
    expect(eventUnitChipData("x", new Map())).toEqual({
      unitId: "x",
      owned: false,
    })
  })
})
