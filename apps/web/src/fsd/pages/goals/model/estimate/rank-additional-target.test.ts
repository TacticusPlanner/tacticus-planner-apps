import { describe, expect, it } from "vitest"

import {
  additionalTargetFromWire,
  additionalTargetOptions,
  additionalTargetSelection,
  rowCount,
  rowLevel,
} from ".//rank-additional-target"

describe("additionalTargetOptions", () => {
  it("offers None + the top-row progression (1 of 3 / 2 of 3 / Top row) below Diamond3", () => {
    expect(additionalTargetOptions("Stone1")).toEqual([
      "None",
      "TopRow1",
      "TopRow2",
      "TopRow",
    ])
    expect(additionalTargetOptions("Diamond2")).toEqual([
      "None",
      "TopRow1",
      "TopRow2",
      "TopRow",
    ])
  })

  it("offers None + the 5 numbered Row options from Diamond3 onward", () => {
    expect(additionalTargetOptions("Diamond3")).toEqual([
      "None",
      "Row1",
      "Row2",
      "Row3",
      "Row4",
      "Row5",
    ])
    expect(additionalTargetOptions("Adamantine2")).toEqual([
      "None",
      "Row1",
      "Row2",
      "Row3",
      "Row4",
      "Row5",
    ])
  })
})

describe("additionalTargetSelection", () => {
  it("resolves None to no partial selection at all", () => {
    expect(additionalTargetSelection("None")).toEqual({
      pointFive: false,
      appliedUpgrades: 0,
      topRowCount: 0,
    })
  })

  it("resolves TopRow1/TopRow2 to a matching appliedUpgrades count and topRowCount", () => {
    expect(additionalTargetSelection("TopRow1")).toEqual({
      pointFive: false,
      appliedUpgrades: 1,
      topRowCount: 1,
    })
    expect(additionalTargetSelection("TopRow2")).toEqual({
      pointFive: false,
      appliedUpgrades: 2,
      topRowCount: 2,
    })
  })

  it("resolves TopRow to pointFive, not a topRowCount/appliedUpgrades count", () => {
    expect(additionalTargetSelection("TopRow")).toEqual({
      pointFive: true,
      appliedUpgrades: 0,
      topRowCount: 0,
    })
  })

  it("resolves RowN to a matching appliedUpgrades count with no topRowCount", () => {
    expect(additionalTargetSelection("Row3")).toEqual({
      pointFive: false,
      appliedUpgrades: 3,
      topRowCount: 0,
    })
  })
})

describe("additionalTargetFromWire", () => {
  it("reconstructs None/TopRow1/TopRow2/TopRow for a pre-Diamond3 rank", () => {
    expect(
      additionalTargetFromWire("Stone1", {
        endPointFive: false,
        endAppliedUpgrades: 0,
      })
    ).toBe("None")
    expect(
      additionalTargetFromWire("Stone1", {
        endPointFive: false,
        endAppliedUpgrades: 1,
      })
    ).toBe("TopRow1")
    expect(
      additionalTargetFromWire("Stone1", {
        endPointFive: false,
        endAppliedUpgrades: 2,
      })
    ).toBe("TopRow2")
    expect(
      additionalTargetFromWire("Stone1", {
        endPointFive: true,
        endAppliedUpgrades: 0,
      })
    ).toBe("TopRow")
  })

  it("reconstructs RowN for a Diamond3+ rank, ignoring endPointFive", () => {
    expect(
      additionalTargetFromWire("Diamond3", {
        endPointFive: false,
        endAppliedUpgrades: 4,
      })
    ).toBe("Row4")
    expect(
      additionalTargetFromWire("Diamond3", {
        endPointFive: false,
        endAppliedUpgrades: 0,
      })
    ).toBe("None")
  })
})

describe("rowCount", () => {
  it("extracts the 1-5 count from a RowN value, null otherwise", () => {
    expect(rowCount("Row1")).toBe(1)
    expect(rowCount("Row5")).toBe(5)
    expect(rowCount("None")).toBeNull()
    expect(rowCount("TopRow")).toBeNull()
    expect(rowCount("TopRow1")).toBeNull()
  })
})

describe("rowLevel", () => {
  it("adds count-1 to the rank's base XP level", () => {
    expect(rowLevel("Diamond3", 1)).toBe(50)
    expect(rowLevel("Diamond3", 5)).toBe(54)
    expect(rowLevel("Stone1", 2)).toBe(2)
  })
})
