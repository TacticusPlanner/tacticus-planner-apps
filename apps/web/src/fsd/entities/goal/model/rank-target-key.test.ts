import { describe, expect, it } from "vitest"
import { Rank, rankIndex } from "@workspace/game-domain"

import { goalRankTargetKey, rankTargetKey } from "./rank-target-key"

const target = (end: Rank, endPointFive = false, endAppliedUpgrades = 0) => ({
  end: rankIndex(end),
  endPointFive,
  endAppliedUpgrades,
})

describe("rankTargetKey", () => {
  it("treats point-five and three applied slots as one target below Adamantine1", () => {
    expect(rankTargetKey(target(Rank.Silver3, true, 0))).toBe(
      rankTargetKey(target(Rank.Silver3, false, 3))
    )
  })

  it("keeps clean and partially applied targets of one rank distinct", () => {
    expect(rankTargetKey(target(Rank.Silver3))).not.toBe(
      rankTargetKey(target(Rank.Silver3, false, 2))
    )
    expect(rankTargetKey(target(Rank.Silver3, false, 2))).not.toBe(
      rankTargetKey(target(Rank.Silver3, true))
    )
  })

  it("distinguishes ranks and caps applied slots at the three-slot row", () => {
    expect(rankTargetKey(target(Rank.Silver3))).not.toBe(
      rankTargetKey(target(Rank.Gold1))
    )
    expect(rankTargetKey(target(Rank.Silver3, false, 5))).toBe(
      rankTargetKey(target(Rank.Silver3, false, 3))
    )
  })

  it("ignores point-five from Adamantine1 and uses the applied count", () => {
    expect(rankTargetKey(target(Rank.Adamantine1, true, 2))).toBe(
      rankTargetKey(target(Rank.Adamantine1, false, 2))
    )
    expect(rankTargetKey(target(Rank.Adamantine1, false, 4))).not.toBe(
      rankTargetKey(target(Rank.Adamantine1, false, 2))
    )
  })

  it("matches the server's key format", () => {
    expect(rankTargetKey(target(Rank.Silver3, true))).toBe(
      `${rankIndex(Rank.Silver3)}:3`
    )
  })
})

describe("goalRankTargetKey", () => {
  it("is null for non-Rank goals and Rank goals without a target", () => {
    expect(
      goalRankTargetKey({
        goalType: "Ability",
        config: { rank: null } as never,
      })
    ).toBeNull()
    expect(
      goalRankTargetKey({ goalType: "Rank", config: { rank: null } as never })
    ).toBeNull()
  })

  it("uses the stored end target", () => {
    expect(
      goalRankTargetKey({
        goalType: "Rank",
        config: {
          rank: {
            start: 0,
            startPointFive: false,
            startAppliedUpgrades: 0,
            ...target(Rank.Gold1),
          },
        } as never,
      })
    ).toBe(`${rankIndex(Rank.Gold1)}:0`)
  })
})
