import { describe, expect, it } from "vitest"

import { medalsOf, reachedBattleRows, withMedals } from "./battle-progress"

const battle = (
  id: string,
  battleIndex: number,
  campaignGroupId = "elite2"
) => ({
  id,
  campaignGroupId,
  nodeNumber: battleIndex + 1,
  battleIndex,
})

describe("reachedBattleRows", () => {
  const battles = [
    battle("FoCE3", 2),
    battle("FoCE1", 0),
    battle("FoCE2", 1),
    battle("FoCE4", 3),
    battle("IE1", 0, "elite1"),
  ]

  it("lists the campaign's battles up to the frontier, in node order", () => {
    expect(reachedBattleRows(battles, "elite2", 2)).toEqual([
      { battleId: "FoCE1", nodeNumber: 1, frontier: false },
      { battleId: "FoCE2", nodeNumber: 2, frontier: false },
      { battleId: "FoCE3", nodeNumber: 3, frontier: true },
    ])
  })

  it("lists nothing for a track with no progress", () => {
    expect(reachedBattleRows(battles, "elite2", undefined)).toEqual([])
  })
})

describe("withMedals", () => {
  it("records a battle below 3 medals and reads it back", () => {
    const next = withMedals([], "FoCE38", 2)
    expect(next).toEqual([
      {
        battleId: "FoCE38",
        medals: 2,
        lightningVictory: null,
        milestone: null,
      },
    ])
    expect(medalsOf(next, "FoCE38")).toBe(2)
    expect(medalsOf(next, "FoCE37")).toBe(3)
  })

  it("drops an entry set back to 3 medals with nothing else recorded", () => {
    expect(withMedals(withMedals([], "FoCE38", 1), "FoCE38", 3)).toEqual([])
  })

  it("keeps an entry at 3 medals that still records a milestone", () => {
    const saved = [
      {
        battleId: "AMS01",
        medals: 2,
        lightningVictory: true,
        milestone: "Gold" as const,
      },
    ]
    expect(withMedals(saved, "AMS01", 3)).toEqual([
      {
        battleId: "AMS01",
        medals: 3,
        lightningVictory: true,
        milestone: "Gold",
      },
    ])
  })
})
