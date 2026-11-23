import { describe, expect, it } from "vitest"

import {
  additionalTargetFromWire,
  additionalTargetOptions,
  additionalTargetSelection,
  additionalTargetSlots,
  rankTargetReached,
  reachableRankProgress,
  rowCount,
  requiredLevelForRankTarget,
  rowLevel,
} from "./rank-additional-target"
import { levelRules } from "@/test/fixtures/level-rules"

describe("additionalTargetOptions", () => {
  it("offers None plus 1-5 applied slots for every rank below the maximum", () => {
    const numbered = ["None", "Row1", "Row2", "Row3", "Row4", "Row5"]
    expect(additionalTargetOptions("Stone1")).toEqual(numbered)
    expect(additionalTargetOptions("Diamond2")).toEqual(numbered)
    expect(additionalTargetOptions("Diamond3")).toEqual(numbered)
    expect(additionalTargetOptions("Adamantine1")).toEqual(numbered)
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
    })
  })

  it("resolves RowN to a matching appliedUpgrades count, never point-five", () => {
    expect(additionalTargetSelection("Row3")).toEqual({
      pointFive: false,
      appliedUpgrades: 3,
    })
    expect(additionalTargetSelection("Row5")).toEqual({
      pointFive: false,
      appliedUpgrades: 5,
    })
  })
})

describe("additionalTargetFromWire", () => {
  it("reconstructs None and RowN below Diamond3", () => {
    for (const [applied, expected] of [
      [0, "None"],
      [1, "Row1"],
      [2, "Row2"],
      [4, "Row4"],
      [5, "Row5"],
    ] as const) {
      expect(
        additionalTargetFromWire("Diamond2", {
          endPointFive: false,
          endAppliedUpgrades: applied,
        })
      ).toBe(expected)
    }
  })

  it("reads a goal saved with point-five as 3 of 6 below Adamantine1", () => {
    for (const rank of ["Stone1", "Diamond2", "Diamond3"] as const) {
      expect(
        additionalTargetFromWire(rank, {
          endPointFive: true,
          endAppliedUpgrades: 0,
        })
      ).toBe("Row3")
    }
  })

  it("reads a Diamond3 goal saved with 1, 2 or 4 slots as that many of 6", () => {
    for (const [applied, expected] of [
      [1, "Row1"],
      [2, "Row2"],
      [4, "Row4"],
    ] as const) {
      expect(
        additionalTargetFromWire("Diamond3", {
          endPointFive: false,
          endAppliedUpgrades: applied,
        })
      ).toBe(expected)
    }
  })

  it("reconstructs RowN for an Adamantine rank and ignores point-five there", () => {
    expect(
      additionalTargetFromWire("Adamantine1", {
        endPointFive: false,
        endAppliedUpgrades: 4,
      })
    ).toBe("Row4")
    expect(
      additionalTargetFromWire("Adamantine1", {
        endPointFive: true,
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
  })
})

describe("rowLevel", () => {
  it("reads the level of the first count slots in book-reading order from the game data", () => {
    expect(rowLevel("Adamantine1", 1, levelRules)).toBe(55)
    expect(rowLevel("Adamantine1", 5, levelRules)).toBe(59)
    expect(rowLevel("Diamond3", 1, levelRules)).toBe(50)
    expect(rowLevel("Diamond3", 5, levelRules)).toBe(54)
    expect(rowLevel("Stone1", 2, levelRules)).toBe(1)
  })

  it("covers the whole top row, not just the cheapest slots", () => {
    // Stone1's top-right slot needs level 2 while its bottom-left and bottom-middle need level 1.
    expect(rowLevel("Stone1", 3, levelRules)).toBe(2)
  })
})

describe("requiredLevelForRankTarget", () => {
  it("needs only the rank's own level for a clean rank", () => {
    expect(requiredLevelForRankTarget("Silver1", "None", levelRules)).toBe(26)
    expect(requiredLevelForRankTarget("Gold1", "None", levelRules)).toBe(35)
  })

  it("needs no extra levels for the top row below Diamond3", () => {
    expect(requiredLevelForRankTarget("Silver1", "Row3", levelRules)).toBe(26)
    expect(requiredLevelForRankTarget("Gold1", "Row1", levelRules)).toBe(35)
    expect(requiredLevelForRankTarget("Gold1", "Row2", levelRules)).toBe(35)
    expect(requiredLevelForRankTarget("Gold1", "Row3", levelRules)).toBe(35)
    expect(requiredLevelForRankTarget("Diamond2", "Row3", levelRules)).toBe(47)
  })

  it("needs one level per bottom-row slot below Diamond3 (Diamond2 4/6 at 48, 5/6 at 49)", () => {
    expect(requiredLevelForRankTarget("Diamond2", "Row4", levelRules)).toBe(48)
    expect(requiredLevelForRankTarget("Diamond2", "Row5", levelRules)).toBe(49)
    expect(requiredLevelForRankTarget("Gold1", "Row4", levelRules)).toBe(36)
    expect(requiredLevelForRankTarget("Gold1", "Row5", levelRules)).toBe(37)
  })

  it("needs one level per numbered slot at Diamond3", () => {
    expect(requiredLevelForRankTarget("Diamond3", "Row1", levelRules)).toBe(50)
    expect(requiredLevelForRankTarget("Diamond3", "Row2", levelRules)).toBe(51)
    expect(requiredLevelForRankTarget("Diamond3", "Row3", levelRules)).toBe(52)
    expect(requiredLevelForRankTarget("Diamond3", "Row4", levelRules)).toBe(53)
    expect(requiredLevelForRankTarget("Diamond3", "Row5", levelRules)).toBe(54)
  })

  it("needs one level per numbered slot at an Adamantine rank", () => {
    expect(requiredLevelForRankTarget("Adamantine1", "Row1", levelRules)).toBe(
      55
    )
    expect(requiredLevelForRankTarget("Adamantine1", "Row3", levelRules)).toBe(
      57
    )
    expect(requiredLevelForRankTarget("Adamantine1", "Row5", levelRules)).toBe(
      59
    )
  })
})

describe("additionalTargetSlots", () => {
  it("names the first N slots in book-reading order", () => {
    expect(additionalTargetSlots("None")).toEqual([])
    expect(additionalTargetSlots("Row1")).toEqual([0])
    expect(additionalTargetSlots("Row3")).toEqual([0, 2, 4])
    expect(additionalTargetSlots("Row4")).toEqual([0, 2, 4, 1])
    expect(additionalTargetSlots("Row5")).toEqual([0, 2, 4, 1, 3])
  })
})

describe("rankTargetReached", () => {
  const current = { rank: "Diamond3" as const, appliedSlots: [0, 2] }

  it("compares different ranks by ladder position", () => {
    expect(rankTargetReached(current, "Diamond2", "Row3")).toBe(true)
    expect(rankTargetReached(current, "Adamantine1", "None")).toBe(false)
  })

  it("is reached on the same rank only once every named slot is applied", () => {
    expect(rankTargetReached(current, "Diamond3", "None")).toBe(true)
    expect(rankTargetReached(current, "Diamond3", "Row2")).toBe(true)
    expect(rankTargetReached(current, "Diamond3", "Row3")).toBe(false)
  })

  it("needs the bottom-row slot for a Diamond2 4/6 target", () => {
    const diamond2 = { rank: "Diamond2" as const, appliedSlots: [0, 2, 4] }
    expect(rankTargetReached(diamond2, "Diamond2", "Row4")).toBe(false)
    expect(
      rankTargetReached(
        { ...diamond2, appliedSlots: [0, 2, 4, 1] },
        "Diamond2",
        "Row4"
      )
    ).toBe(true)
  })
})

describe("reachableRankProgress", () => {
  it("grants a rank's free slots immediately at its base level, then one more per level (real fixture: Neurothrope, Diamond1 partial)", () => {
    // Diamond1 (level 44) to Diamond2 (level 47) is a 3-level gap: 3 slots free at 44, one more
    // per level at 45/46, and the 47th level ranks up to Diamond2's own fresh 3/6 — matching what
    // was observed live for a real Diamond1 character mid-way through its bottom row.
    expect(reachableRankProgress(44, "Diamond3", levelRules)).toEqual({
      rank: "Diamond1",
      appliedSlots: 3,
    })
    expect(reachableRankProgress(45, "Diamond3", levelRules)).toEqual({
      rank: "Diamond1",
      appliedSlots: 4,
    })
    expect(reachableRankProgress(46, "Diamond3", levelRules)).toEqual({
      rank: "Diamond1",
      appliedSlots: 5,
    })
    expect(reachableRankProgress(47, "Diamond3", levelRules)).toEqual({
      rank: "Diamond2",
      appliedSlots: 3,
    })
  })

  it("derives free vs. gated slots from the table's own gap, not a hardcoded 3 (Stone tier's shorter 2-level gaps)", () => {
    // Stone1 (level 1) to Stone2 (level 3) is only a 2-level gap: 4 slots free, 2 gated.
    expect(reachableRankProgress(1, "Stone3", levelRules)).toEqual({
      rank: "Stone1",
      appliedSlots: 4,
    })
    expect(reachableRankProgress(2, "Stone3", levelRules)).toEqual({
      rank: "Stone1",
      appliedSlots: 5,
    })
    expect(reachableRankProgress(3, "Stone3", levelRules)).toEqual({
      rank: "Stone2",
      appliedSlots: 4,
    })
  })

  it("caps at the rarity ceiling's own slots rather than rolling into a rank rarity forbids", () => {
    // Level 60 alone would roll all the way to Adamantine2, but a Rare-rarity character can't rank
    // past Silver1 — the result stays at Silver1, maxed out (6/6), not the next rank.
    expect(reachableRankProgress(60, "Silver1", levelRules)).toEqual({
      rank: "Silver1",
      appliedSlots: 6,
    })
  })

  it("returns the ladder's first rank with zero slots below its own base level", () => {
    expect(reachableRankProgress(0, "Diamond3", levelRules)).toEqual({
      rank: "Stone1",
      appliedSlots: 0,
    })
  })
})
