import { describe, expect, it } from "vitest"

import { hseTier } from "@/test/fixtures/home-screen-event-scoring"

import { hseMilestoneCells } from "./hse-milestones"

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
