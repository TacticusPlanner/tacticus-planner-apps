import { describe, expect, it } from "vitest"

import {
  additionalTargetFromWire,
  additionalTargetOptions,
  additionalTargetSelection,
  reachableRankProgress,
  rowCount,
  rowLevel,
} from "./rank-additional-target"

describe("additionalTargetOptions", () => {
  it("offers only None and the full top row below Adamantine", () => {
    expect(additionalTargetOptions("Stone1")).toEqual(["None", "TopRow"])
    expect(additionalTargetOptions("Diamond3")).toEqual(["None", "TopRow"])
  })

  it("offers None plus 1-5 applied slots at a non-maximum Adamantine rank", () => {
    expect(additionalTargetOptions("Adamantine1")).toEqual([
      "None",
      "Row1",
      "Row2",
      "Row3",
      "Row4",
      "Row5",
    ])
  })

  it("offers only None at the current maximum rank", () => {
    expect(additionalTargetOptions("Adamantine2")).toEqual(["None"])
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

  it("preserves Diamond3 TopRow through the endPointFive wire value", () => {
    expect(
      additionalTargetFromWire("Diamond3", {
        endPointFive: true,
        endAppliedUpgrades: 0,
      })
    ).toBe("TopRow")
  })

  it("reconstructs RowN for an Adamantine rank", () => {
    expect(
      additionalTargetFromWire("Adamantine1", {
        endPointFive: false,
        endAppliedUpgrades: 4,
      })
    ).toBe("Row4")
    expect(
      additionalTargetFromWire("Adamantine1", {
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

describe("reachableRankProgress", () => {
  it("grants a rank's free slots immediately at its base level, then one more per level (real fixture: Neurothrope, Diamond1 partial)", () => {
    // Diamond1 (level 44) to Diamond2 (level 47) is a 3-level gap: 3 slots free at 44, one more
    // per level at 45/46, and the 47th level ranks up to Diamond2's own fresh 3/6 — matching what
    // was observed live for a real Diamond1 character mid-way through its bottom row.
    expect(reachableRankProgress(44, "Diamond3")).toEqual({
      rank: "Diamond1",
      appliedSlots: 3,
    })
    expect(reachableRankProgress(45, "Diamond3")).toEqual({
      rank: "Diamond1",
      appliedSlots: 4,
    })
    expect(reachableRankProgress(46, "Diamond3")).toEqual({
      rank: "Diamond1",
      appliedSlots: 5,
    })
    expect(reachableRankProgress(47, "Diamond3")).toEqual({
      rank: "Diamond2",
      appliedSlots: 3,
    })
  })

  it("derives free vs. gated slots from the table's own gap, not a hardcoded 3 (Stone tier's shorter 2-level gaps)", () => {
    // Stone1 (level 1) to Stone2 (level 3) is only a 2-level gap: 4 slots free, 2 gated.
    expect(reachableRankProgress(1, "Stone3")).toEqual({
      rank: "Stone1",
      appliedSlots: 4,
    })
    expect(reachableRankProgress(2, "Stone3")).toEqual({
      rank: "Stone1",
      appliedSlots: 5,
    })
    expect(reachableRankProgress(3, "Stone3")).toEqual({
      rank: "Stone2",
      appliedSlots: 4,
    })
  })

  it("caps at the rarity ceiling's own slots rather than rolling into a rank rarity forbids", () => {
    // Level 60 alone would roll all the way to Adamantine2, but a Rare-rarity character can't rank
    // past Silver1 — the result stays at Silver1, maxed out (6/6), not the next rank.
    expect(reachableRankProgress(60, "Silver1")).toEqual({
      rank: "Silver1",
      appliedSlots: 6,
    })
  })

  it("returns the ladder's first rank with zero slots below its own base level", () => {
    expect(reachableRankProgress(0, "Diamond3")).toEqual({
      rank: "Stone1",
      appliedSlots: 0,
    })
  })
})
