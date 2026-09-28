import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"
import type { MowStorageModel } from "@workspace/game-catalog"

import type { GoalDetail } from "@/entities/goal"
import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"

import {
  abilityResourceNeed,
  rankResourceNeed,
  rankSlotsRemaining,
} from "./goal-need"
import { createCraftedInventoryPool } from "./upgrade-recipe"

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

describe("Rank need after the target is edited in place", () => {
  // edit-goal-targets-in-place: the goal keeps its id and start, only `end` moves — every need is derived
  // from the goal detail, so the refreshed detail alone must change the result.
  const player = { rank: "Stone1", appliedUpgradeSlots: [] } as never
  const need = (end: number) =>
    rankResourceNeed({
      detail: goalDetail({ start: 0, end }),
      character,
      playerCharacter: player,
      upgradesById: new Map(),
    })

  it("grows the need when the target is raised", () => {
    const before = need(1)
    const after = need(2)

    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    expect(after!.length).toBeGreaterThan(before!.length)
    expect(
      rankSlotsRemaining({
        detail: goalDetail({ start: 0, end: 1 }),
        character,
        playerCharacter: player,
      })
    ).toBe(6)
    expect(
      rankSlotsRemaining({
        detail: goalDetail({ start: 0, end: 2 }),
        character,
        playerCharacter: player,
      })
    ).toBe(12)
  })

  it("has no remaining need for a target the character has already reached", () => {
    const reached = { rank: "Stone3", appliedUpgradeSlots: [] } as never

    expect(
      rankSlotsRemaining({
        detail: goalDetail({ start: 0, end: 1 }),
        character,
        playerCharacter: reached,
      })
    ).toBeNull()
  })
})

describe("Overlapping Rank milestones for one character are allocated once", () => {
  // The fixture character has 6 distinctly-identified slots per rank, so counts are per slot. Indices:
  // 0 = Stone1, 1 = Stone2, 2 = Stone3.
  const count = (needs: { count: number }[] | null) =>
    (needs ?? []).reduce((total, need) => total + need.count, 0)
  const rank = (
    end: number,
    extras: { endPointFive?: boolean; endAppliedUpgrades?: number } = {}
  ) => goalDetail({ start: 0, end, ...extras })
  const player = { rank: "Stone1", appliedUpgradeSlots: [] } as never

  const allocate = (
    goals: GoalDetail[],
    playerCharacter: never = player,
    covered = new Set<string>()
  ) =>
    goals.map((detail) => ({
      slots: rankSlotsRemaining({
        detail,
        character,
        playerCharacter,
        coveredRankSlots: covered,
      }),
      needs: rankResourceNeed({
        detail,
        character,
        playerCharacter,
        upgradesById: new Map(),
        coveredRankSlots: covered,
      }),
    }))

  it("charges the shared progression to the first milestone and only the extra to the second", () => {
    const [near, far] = allocate([rank(1), rank(2)])

    // Stone1 -> Stone2 is 6 slots; Stone1 -> Stone3 adds Stone2's 6 more, not 12.
    expect(count(near!.needs)).toBe(6)
    expect(count(far!.needs)).toBe(6)
    expect(count(near!.needs) + count(far!.needs)).toBe(12) // not 6 + 12
    expect([near!.slots, far!.slots]).toEqual([6, 6])
  })

  it("gives a later, wholly covered target no additional demand but keeps it a distinct goal", () => {
    const [far, near] = allocate([rank(2), rank(1)])

    expect(count(far!.needs)).toBe(12)
    expect(near!.needs).toEqual([]) // applicable, zero additional — not null
    expect(near!.slots).toBe(0)
  })

  it("splits overlapping partial slots at the end rank", () => {
    // First: Stone1 -> Stone2 clean (6 slots). Second: Stone1 -> Stone2 with the top-row half step, which
    // adds only Stone2's three top-row slots.
    const [clean, partial] = allocate([
      rank(1),
      rank(1, { endPointFive: true }),
    ])

    expect(count(clean!.needs)).toBe(6)
    expect(count(partial!.needs)).toBe(3)
  })

  it("nets slots the player already applied before allocating, once", () => {
    const applied = { rank: "Stone1", appliedUpgradeSlots: [0, 1] } as never
    const [near, far] = allocate([rank(1), rank(2)], applied)

    expect(count(near!.needs)).toBe(4) // Stone1's 6 minus 2 applied
    expect(count(far!.needs)).toBe(6) // Stone2 only
  })

  it("does not consume an owned crafted upgrade twice for overlapping milestones", () => {
    const crafted = upgradeId("crafted")
    const base = upgradeId("base")
    const oneSlot: FarmingCharacter = {
      ...character,
      rankUpUpgrades: [{ rank: "Stone1", upgradeIds: [crafted] }],
    }
    const upgradesById = new Map([
      [
        crafted,
        { id: crafted, crafted: true, recipe: [{ material: base, count: 2 }] },
      ],
      [base, { id: base, crafted: false, recipe: [] }],
    ]) as unknown as ReadonlyMap<never, FarmingUpgrade>
    const pool = createCraftedInventoryPool(
      [{ upgradeId: crafted, amount: 1 }],
      upgradesById as never
    )
    const covered = new Set<string>()
    const run = (detail: GoalDetail) =>
      rankResourceNeed({
        detail,
        character: oneSlot,
        playerCharacter: player,
        upgradesById: upgradesById as never,
        craftedInventory: pool,
        coveredRankSlots: covered,
      })

    // The first milestone spends the owned crafted upgrade (no base needed); the second crosses the
    // same slot, so it neither re-spends inventory nor asks for its base materials.
    expect(run(rank(1))).toEqual([])
    expect(run(rank(1, { endPointFive: true }))).toEqual([])
    expect(pool.get(crafted)).toBe(0)
  })

  it("counts a goal's slots before its own claim makes them read as covered", () => {
    const covered = new Set<string>()
    const detail = rank(1)
    const params = { detail, character, playerCharacter: player }

    const slots = rankSlotsRemaining({ ...params, coveredRankSlots: covered })
    rankResourceNeed({
      ...params,
      upgradesById: new Map(),
      coveredRankSlots: covered,
    })

    expect(slots).toBe(6)
    expect(rankSlotsRemaining({ ...params, coveredRankSlots: covered })).toBe(0)
  })
})

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

  it("removes applied slots before consuming matching crafted inventory", () => {
    const crafted = upgradeId("crafted")
    const base = upgradeId("base")
    const craftedCharacter: FarmingCharacter = {
      ...character,
      rankUpUpgrades: [
        {
          rank: "Stone1",
          upgradeIds: [crafted, crafted, base, base, base, base],
        },
        { rank: "Stone2", upgradeIds: [] },
      ],
    }
    const upgradesById = new Map([
      [
        crafted,
        {
          id: crafted,
          label: "Crafted",
          rarity: "Common",
          stat: "health",
          crafted: true,
          recipe: [{ material: base, count: 2 }],
          farmLocations: [],
        } as FarmingUpgrade,
      ],
      [
        base,
        {
          id: base,
          label: "Base",
          rarity: "Common",
          stat: "health",
          crafted: false,
          recipe: [],
          farmLocations: [],
        } as FarmingUpgrade,
      ],
    ])
    const craftedInventory = createCraftedInventoryPool(
      [{ upgradeId: crafted, amount: 1 }],
      upgradesById
    )

    expect(
      rankResourceNeed({
        detail: goalDetail({ start: 0, end: 1 }),
        character: craftedCharacter,
        playerCharacter: {
          rank: "Stone1",
          appliedUpgradeSlots: [0],
        } as never,
        upgradesById,
        craftedInventory,
      })
    ).toEqual([{ id: base, count: 4 }])
    expect(craftedInventory.get(crafted)).toBe(0)
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

describe("abilityResourceNeed", () => {
  it("consumes nested crafted inventory before expanding MoW ability recipes", () => {
    const top = upgradeId("top")
    const nested = upgradeId("nested")
    const base = upgradeId("base")
    const upgradesById = new Map([
      [
        top,
        {
          id: top,
          label: "Top",
          rarity: "Common",
          stat: "health",
          crafted: true,
          recipe: [{ material: nested, count: 2 }],
          farmLocations: [],
        } as FarmingUpgrade,
      ],
      [
        nested,
        {
          id: nested,
          label: "Nested",
          rarity: "Common",
          stat: "health",
          crafted: true,
          recipe: [{ material: base, count: 3 }],
          farmLocations: [],
        } as FarmingUpgrade,
      ],
      [
        base,
        {
          id: base,
          label: "Base",
          rarity: "Common",
          stat: "health",
          crafted: false,
          recipe: [],
          farmLocations: [],
        } as FarmingUpgrade,
      ],
    ])
    const craftedInventory = createCraftedInventoryPool(
      [{ upgradeId: nested, amount: 1 }],
      upgradesById
    )

    expect(
      abilityResourceNeed({
        detail: {
          config: {
            ability: {
              activeStart: 1,
              activeEnd: 2,
              passiveStart: 1,
              passiveEnd: 1,
            },
          },
        } as GoalDetail,
        mow: {
          primaryAbility: { recipes: [[top]] },
          secondaryAbility: { recipes: [] },
        } as unknown as MowStorageModel,
        playerMow: undefined,
        upgradesById,
        craftedInventory,
      })
    ).toEqual([{ id: base, count: 3 }])
  })

  it("sums both ability tracks when a goal raises primary and secondary together", () => {
    const pA = upgradeId("pA")
    const pB = upgradeId("pB")
    const sA = upgradeId("sA")
    const upgradesById = new Map(
      [pA, pB, sA].map((id) => [
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

    const need = abilityResourceNeed({
      detail: {
        config: {
          ability: {
            activeStart: 1,
            activeEnd: 3, // primary raises through recipes[0] (pA) and recipes[1] (pB)
            passiveStart: 1,
            passiveEnd: 2, // secondary raises through recipes[0] (sA)
          },
        },
      } as GoalDetail,
      mow: {
        primaryAbility: { recipes: [[pA], [pB]] },
        secondaryAbility: { recipes: [[sA], [sA]] },
      } as unknown as MowStorageModel,
      playerMow: undefined,
      upgradesById,
    })

    expect(need).toEqual(
      expect.arrayContaining([
        { id: pA, count: 1 },
        { id: pB, count: 1 },
        { id: sA, count: 1 },
      ])
    )
    expect(need).toHaveLength(3)
  })
})
