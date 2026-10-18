import { describe, expect, it } from "vitest"

import { splitPlanByRun } from "./token-runs"
import type { RunSupply } from "./token-supply"

const run = (
  number: 1 | 2 | 3,
  state: RunSupply["state"],
  total: number,
  unknownRun = false
): RunSupply => ({
  run: number,
  state,
  unknownRun,
  free: total,
  ad: 0,
  bonusDelivery: 0,
  total,
})
const worked = [run(1, "done", 0), run(2, "now", 32), run(3, "planned", 68)]

describe("splitPlanByRun (spec: Token plan list)", () => {
  it("puts the worked 6 tokens in run 2 and none in run 3", () => {
    expect(splitPlanByRun(6, worked)).toEqual({
      sections: [
        {
          run: 2,
          state: "now",
          unknownRun: false,
          available: 32,
          start: 0,
          count: 6,
        },
        {
          run: 3,
          state: "planned",
          unknownRun: false,
          available: 68,
          start: 6,
          count: 0,
        },
      ],
      overflow: null,
    })
  })

  it("carries 40 tokens into run 3 after run 2's 32", () => {
    const { sections } = splitPlanByRun(40, worked)
    expect(sections.map(({ start, count }) => [start, count])).toEqual([
      [0, 32],
      [32, 8],
    ])
  })

  it("leaves 10 of 110 tokens beyond run 3's supply", () => {
    expect(splitPlanByRun(110, worked).overflow).toEqual({
      start: 100,
      count: 10,
    })
  })

  it("plans one Next section for an unknown run", () => {
    const split = splitPlanByRun(70, [run(1, "next", 68, true)])
    expect(split.sections).toEqual([
      {
        run: 1,
        state: "next",
        unknownRun: true,
        available: 68,
        start: 0,
        count: 68,
      },
    ])
    expect(split.overflow).toEqual({ start: 68, count: 2 })
  })
})
