import { describe, expect, it } from "vitest"
import { upgradeIdSchema } from "@workspace/game-domain"

import {
  projectResourceProgress,
  resourceMilestoneTargets,
  totalResourceProgress,
} from "./daily-raids-progress"
import type { DailyRaidsCalculationViewModel } from "./daily-raids.domain"

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

describe("resourceMilestoneTargets", () => {
  it("lists a resource's cumulative target per milestone that needs it", () => {
    const milestones = resourceMilestoneTargets([
      {
        goalId: "g1",
        priority: 1,
        needs: [],
        stages: [
          {
            target: "G1",
            needs: [
              { id: up("wing"), count: 20 },
              { id: up("wing"), count: 8 },
              { id: up("only"), count: 3 },
            ],
          },
          { target: "G3", needs: [{ id: up("other"), count: 2 }] },
          { target: "D3", needs: [{ id: up("wing"), count: 36 }] },
        ],
      },
      { goalId: "g2", priority: 2, needs: [{ id: up("wing"), count: 9 }] },
    ])
    expect(milestones.get("g1:wing")).toEqual([28, 64])
    // A resource only one milestone needs, and a goal without stages, keep the final target.
    expect(milestones.has("g1:only")).toBe(false)
    expect(milestones.has("g2:wing")).toBe(false)
  })
})

const day = (
  dayNumber: number,
  itemsFarmed: number
): DailyRaidsCalculationViewModel["today"] =>
  ({
    day: dayNumber,
    entries: [{ goalId: "g1", resourceId: up("wing"), itemsFarmed }],
  }) as unknown as DailyRaidsCalculationViewModel["today"]

describe("projectResourceProgress", () => {
  it("counts toward the next milestone, then the following one once it is reached", () => {
    const byDay = projectResourceProgress(
      [day(1, 27), day(2, 10), day(3, 0)],
      new Map([["g1:wing", { owned: 1, target: 64 }]]),
      new Map([["g1:wing", [28, 64]]])
    )
    expect(byDay.get(1)?.get("g1:wing")).toEqual({ owned: 1, target: 28 })
    expect(byDay.get(2)?.get("g1:wing")).toEqual({ owned: 28, target: 64 })
    expect(byDay.get(3)?.get("g1:wing")).toEqual({ owned: 38, target: 64 })
  })

  it("keeps the final target without milestones", () => {
    const byDay = projectResourceProgress(
      [day(1, 0)],
      new Map([["g1:wing", { owned: 1, target: 64 }]])
    )
    expect(byDay.get(1)?.get("g1:wing")).toEqual({ owned: 1, target: 64 })
  })
})
