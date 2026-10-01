import { describe, expect, it } from "vitest"
import { upgradeIdSchema } from "@workspace/game-domain"

import { totalResourceProgress } from "./daily-raids-progress"

const up = upgradeIdSchema.parse

describe("totalResourceProgress", () => {
  const progress = new Map([
    ["g1:matA", { owned: 30, target: 100 }],
    ["g2:matA", { owned: 10, target: 40 }],
    ["g1:matB", { owned: 0, target: 5 }],
    ["g3:unitX", { owned: 20, target: 50 }],
    ["g4:unitX", { owned: 20, target: 80 }],
    ["g5:matDone", { owned: 0, target: 0 }],
  ])
  const inventory = [
    { id: up("matA"), count: 55 },
    { id: up("matC"), count: 9 },
  ]
  const totals = totalResourceProgress(progress, inventory, new Set(["unitX"]))

  it("sums an upgrade's targets over goals and reports the inventory it is held in", () => {
    expect(totals.get("matA")).toEqual({ owned: 55, target: 140 })
  })

  it("holds an upgrade the inventory lacks at 0, not at a goal's allocation", () => {
    expect(totals.get("matB")).toEqual({ owned: 0, target: 5 })
  })

  it("does not add shard targets of goals on one unit: the highest target wins", () => {
    expect(totals.get("unitX")).toEqual({ owned: 20, target: 80 })
  })

  it("leaves out resources with no target and inventory no goal wants", () => {
    expect(totals.has("matDone")).toBe(false)
    expect(totals.has("matC")).toBe(false)
  })

  it("does not cap what is held at the target", () => {
    const over = totalResourceProgress(
      new Map([["g1:matA", { owned: 10, target: 10 }]]),
      [{ id: up("matA"), count: 120 }],
      new Set()
    )
    expect(over.get("matA")).toEqual({ owned: 120, target: 10 })
  })
})
