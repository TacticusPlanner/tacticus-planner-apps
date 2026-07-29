import { describe, expect, it } from "vitest"
import { rankOrder } from "@workspace/game-domain"

import { farmingStageTargets } from ".//farming-stages"

const rank = (value: string) =>
  rankOrder.indexOf(value as (typeof rankOrder)[number])

describe("farmingStageTargets", () => {
  it("generates exact rank strategy breakpoints and always appends the target", () => {
    expect(
      farmingStageTargets("rank", rank("Iron1"), rank("Diamond2"), "Milestones")
    ).toEqual([
      rank("Bronze1"),
      rank("Silver1"),
      rank("Gold1"),
      rank("Diamond1"),
      rank("Diamond2"),
    ])
    expect(
      farmingStageTargets(
        "rank",
        rank("Silver2"),
        rank("Diamond2"),
        "MajorMilestones"
      )
    ).toEqual([rank("Gold1"), rank("Diamond2")])
    expect(
      farmingStageTargets("rank", rank("Gold1"), rank("Gold3"), "EveryStep")
    ).toEqual([rank("Gold2"), rank("Gold3")])
    expect(
      farmingStageTargets(
        "rank",
        rank("Gold1"),
        rank("Diamond1"),
        "TotalUpgrades"
      )
    ).toEqual([rank("Diamond1")])
  })

  it("generates exact MoW ability strategy breakpoints", () => {
    expect(farmingStageTargets("ability", 8, 52, "Milestones")).toEqual([
      17, 26, 35, 50, 52,
    ])
    expect(farmingStageTargets("ability", 8, 52, "MajorMilestones")).toEqual([
      35, 50, 52,
    ])
    expect(farmingStageTargets("ability", 15, 18, "EveryStep")).toEqual([
      16, 17, 18,
    ])
    expect(farmingStageTargets("ability", 15, 18, "TotalUpgrades")).toEqual([
      18,
    ])
  })
})
