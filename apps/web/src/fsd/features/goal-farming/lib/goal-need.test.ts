import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"

import { rankResourceNeed, rankSlotsRemaining } from "./goal-need"

const upgradeId = upgradeIdSchema.parse
const upgradeIds = (values: string[]) => values.map((value) => upgradeId(value))

// 6 upgrades per rank, ordered [Health, Health, Damage, Damage, Armour, Armour] — mirrors
// rank-lookup-calc.test.ts's fixture.
const character: FarmingCharacter = {
  id: unitIdSchema.parse("astarCyrus"),
  name: "Cyrus",
  rankUpUpgrades: [
    {
      rank: "Stone1",
      upgradeIds: upgradeIds(["h1", "h2", "d1", "d2", "a1", "a2"]),
    },
    {
      rank: "Stone2",
      upgradeIds: upgradeIds(["h3", "h4", "d3", "d4", "a3", "a4"]),
    },
    {
      rank: "Stone3",
      upgradeIds: upgradeIds(["h5", "h6", "d5", "d6", "a5", "a6"]),
    },
  ],
}

function goalDetail(rank: {
  start: number
  end: number
  endPointFive?: boolean
  endAppliedUpgrades?: number
}): GoalDetail {
  return {
    config: {
      rank: {
        start: rank.start,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end: rank.end,
        endPointFive: rank.endPointFive ?? false,
        endAppliedUpgrades: rank.endAppliedUpgrades ?? 0,
      },
    },
  } as GoalDetail
}

describe("rankSlotsRemaining", () => {
  it("counts every slot across the full range when nothing is applied yet", () => {
    // Stone1 (index 0) -> Stone3 (index 2): 2 full ranks crossed = 12 slots.
    const detail = goalDetail({ start: 0, end: 2 })
    expect(
      rankSlotsRemaining({
        detail,
        character,
        playerCharacter: { rank: "Stone1", appliedUpgradeSlots: [] } as never,
      })
    ).toBe(12)
  })

  it("nets already-applied slots at the character's current rank", () => {
    // Still Stone1 -> Stone3, but 2 of Stone1's 6 slots are already filled.
    const detail = goalDetail({ start: 0, end: 2 })
    expect(
      rankSlotsRemaining({
        detail,
        character,
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [0, 2],
        } as never,
      })
    ).toBe(10)
  })

  it("does not net applied slots against a rank the character hasn't reached yet", () => {
    // Goal configured from Stone1, but the character is still at Stone1 with slots applied — those
    // slots DO count (character is at the range's start rank).
    // Configuring the goal ahead of where the character actually is, instead, must not double-net.
    const detail = goalDetail({ start: 1, end: 2 })
    expect(
      rankSlotsRemaining({
        detail,
        character,
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [0, 1, 2],
        } as never,
      })
    ).toBe(6)
  })

  it("counts only the top-row partial at the end rank when point-five is set", () => {
    // Stone1 -> Stone2 (6 slots) + point-five of Stone2 (top row only: h3, d3, a3 = 3 slots) = 9.
    const detail = goalDetail({ start: 0, end: 1, endPointFive: true })
    expect(
      rankSlotsRemaining({
        detail,
        character,
        playerCharacter: { rank: "Stone1", appliedUpgradeSlots: [] } as never,
      })
    ).toBe(9)
  })

  it("counts and costs a same-rank partial target", () => {
    const detail = goalDetail({ start: 1, end: 1, endAppliedUpgrades: 2 })
    const playerCharacter = {
      rank: "Stone2",
      appliedUpgradeSlots: [0],
    } as never
    expect(rankSlotsRemaining({ detail, character, playerCharacter })).toBe(1)

    const upgradesById = new Map(
      character.rankUpUpgrades.flatMap((rank) =>
        rank.upgradeIds.map((id) => [
          id,
          {
            id,
            label: id,
            rarity: "Common",
            stat: "health",
            crafted: false,
            recipe: [],
            farmLocations: [],
          } as FarmingUpgrade,
        ])
      )
    )
    expect(
      rankResourceNeed({
        detail,
        character,
        playerCharacter,
        upgradesById,
      })
    ).toEqual([{ id: upgradeId("d3"), count: 1 }])
  })

  it("does not subtract matching materials from completed earlier ranks", () => {
    const repeatedId = upgradeId("shared")
    const repeatedMaterialCharacter: FarmingCharacter = {
      ...character,
      rankUpUpgrades: [
        { rank: "Stone1", upgradeIds: Array(6).fill(repeatedId) },
        { rank: "Stone2", upgradeIds: Array(6).fill(repeatedId) },
        { rank: "Stone3", upgradeIds: Array(6).fill(repeatedId) },
      ],
    }
    const detail = goalDetail({ start: 0, end: 2 })
    const playerCharacter = {
      rank: "Stone2",
      appliedUpgradeSlots: [0, 1, 2],
    } as never
    const upgradesById = new Map([
      [
        repeatedId,
        {
          id: repeatedId,
          label: "Shared material",
          rarity: "Common",
          stat: "health",
          crafted: false,
          recipe: [],
          farmLocations: [],
        } as FarmingUpgrade,
      ],
    ])

    expect(
      rankResourceNeed({
        detail,
        character: repeatedMaterialCharacter,
        playerCharacter,
        upgradesById,
      })
    ).toEqual([{ id: repeatedId, count: 3 }])
  })

  it("returns null when the goal has no rank target", () => {
    expect(
      rankSlotsRemaining({
        detail: { config: {} } as GoalDetail,
        character,
        playerCharacter: undefined,
      })
    ).toBeNull()
  })

  it("returns null when there's no catalog entry for the character", () => {
    const detail = goalDetail({ start: 0, end: 2 })
    expect(
      rankSlotsRemaining({
        detail,
        character: undefined,
        playerCharacter: undefined,
      })
    ).toBeNull()
  })
})
