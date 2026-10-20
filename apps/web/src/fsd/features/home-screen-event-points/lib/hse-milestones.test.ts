import { describe, expect, it } from "vitest"

import { hseTier } from "@/test/fixtures/home-screen-event-scoring"

import {
  hseCurrentMilestoneCell,
  hseMilestoneCells,
  hseMilestonesMax,
  hseProgressPoints,
} from "./hse-milestones"

describe("hseMilestoneCells", () => {
  it("gives Psyker Boost High 19 incremental milestones and an endless 50-point cell", () => {
    const cells = hseMilestoneCells(hseTier("hse-trait-boost-psyker", "High"))

    expect(cells).toHaveLength(20)
    expect(cells.slice(0, 5).map((cell) => cell.points)).toEqual([
      20, 20, 20, 20, 25,
    ])
    expect(cells[18]).toEqual({
      points: 60, // 765 - 705
      cumulativePoints: 765,
      rewardId: "draft_abilityTokensMythic",
      quantity: 5,
      endless: false,
      cap: null,
    })
    expect(cells[19]).toEqual({
      points: 50,
      cumulativePoints: 815,
      rewardId: "draft_abilityTokensLegendary",
      quantity: 1,
      endless: true,
      cap: null,
    })
  })

  it("carries the repeat cap, and has no endless cell without a repeat", () => {
    expect(
      hseMilestoneCells(hseTier("hse-faction-boost", "High", "DarkAngels")).at(
        -1
      )
    ).toMatchObject({ endless: true, cap: 200 })
    expect(
      hseMilestoneCells(hseTier("hse-arsenal-of-war", "High")).some(
        (cell) => cell.endless
      )
    ).toBe(false)
  })
})

describe("hseProgressPoints", () => {
  const psyker = hseMilestoneCells(hseTier("hse-trait-boost-psyker", "High"))
  const progress = (milestonesDone: number, pointsInMilestone: number) =>
    hseProgressPoints(psyker, { milestonesDone, pointsInMilestone })

  it("adds the completed milestones' points to the points in the current one", () => {
    expect(progress(0, 0)).toBe(0)
    expect(progress(0, 12)).toBe(12)
    // 10 milestones reach 270; the 11th is 50 points.
    expect(progress(10, 30)).toBe(300)
  })

  it("counts each milestone past the last as one repeat step", () => {
    // 19 milestones reach 765, then 50 per repeat.
    expect(progress(19, 35)).toBe(800)
    expect(progress(21, 0)).toBe(865)
  })

  it("caps the points in a milestone at that milestone's points", () => {
    expect(progress(0, 35)).toBe(20)
  })

  it("stops at a capped repeat's last reward", () => {
    const cells = hseMilestoneCells({
      milestones: [
        { requiredPoints: 10, rewardId: "a", quantity: 1 },
        { requiredPoints: 30, rewardId: "b", quantity: 1 },
      ],
      repeat: { points: 5, rewardId: "c", quantity: 1, cap: 2 },
    })
    expect(hseMilestonesMax(cells)).toBe(4)
    expect(hseCurrentMilestoneCell(cells, 1)?.points).toBe(20)
    expect(hseCurrentMilestoneCell(cells, 3)?.endless).toBe(true)
    expect(hseCurrentMilestoneCell(cells, 4)).toBeNull()
    expect(
      hseProgressPoints(cells, { milestonesDone: 9, pointsInMilestone: 3 })
    ).toBe(40)
  })

  it("has no limit without a repeat cap, and stops at the last milestone without a repeat", () => {
    expect(hseMilestonesMax(psyker)).toBeNull()
    const cells = hseMilestoneCells({
      milestones: [{ requiredPoints: 10, rewardId: "a", quantity: 1 }],
      repeat: null,
    })
    expect(hseMilestonesMax(cells)).toBe(1)
    expect(
      hseProgressPoints(cells, { milestonesDone: 1, pointsInMilestone: 4 })
    ).toBe(10)
  })
})
