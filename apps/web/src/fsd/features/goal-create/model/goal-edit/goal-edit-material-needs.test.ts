import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type { Character } from "@/features/rank-lookup/@x/goal-create"

import {
  goalEditMaterialNeeds,
  type GoalEditLiveProgress,
} from "./goal-edit-material-needs"

const upgradeIds = (values: string[]) =>
  values.map((value) => upgradeIdSchema.parse(value))

// Six base upgrades per rank; every id reads as a base upgrade (absent from `upgradesById`).
const character: Character = {
  id: unitIdSchema.parse("hero-1"),
  name: "Hero",
  rankUpUpgrades: [
    {
      rank: "Stone1",
      upgradeIds: upgradeIds(["h1", "h2", "d1", "d2", "a1", "a2"]),
    },
    {
      rank: "Stone2",
      upgradeIds: upgradeIds(["h1", "h3", "d3", "d4", "a3", "a4"]),
    },
  ],
}

const catalog = {
  getCharacter: () => character,
  mowsById: new Map(),
  upgradesById: new Map(),
} as unknown as Parameters<typeof goalEditMaterialNeeds>[2]

// A Rank goal created at Stone I, targeting Stone III.
const rankGoal = {
  goalId: "goal-1",
  goalType: "Rank",
  entityType: "Character",
  entityId: "hero-1",
  config: {
    rank: {
      start: 0,
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: 2,
      endPointFive: false,
      endAppliedUpgrades: 0,
    },
  },
} as unknown as GoalDetail

const hero = (rank: string, appliedUpgradeSlots: number[] = []) =>
  ({ unitId: "hero-1", rank, appliedUpgradeSlots }) as unknown as NonNullable<
    GoalEditLiveProgress["character"]
  >

const byId = (needs: { id: string; missing: number }[]) =>
  Object.fromEntries(needs.map((need) => [need.id, need.missing]))

describe("goalEditMaterialNeeds", () => {
  it("is the gross need from the stored start without live progress", () => {
    expect(byId(goalEditMaterialNeeds(rankGoal, null, catalog))).toEqual({
      h1: 2,
      h2: 1,
      h3: 1,
      d1: 1,
      d2: 1,
      d3: 1,
      d4: 1,
      a1: 1,
      a2: 1,
      a3: 1,
      a4: 1,
    })
  })

  it("counts from the synced rank once the unit has ranked past the stored start, less the inventory", () => {
    const needs = goalEditMaterialNeeds(rankGoal, null, catalog, {
      character: hero("Stone2"),
      inventoryUpgrades: [
        { upgradeId: upgradeIdSchema.parse("h3"), amount: 1 },
      ] as GoalEditLiveProgress["inventoryUpgrades"],
    })

    expect(byId(needs)).toEqual({
      h1: 1,
      h3: 0,
      d3: 1,
      d4: 1,
      a3: 1,
      a4: 1,
    })
  })

  it("leaves nothing to farm once every slot on the synced rank is applied", () => {
    const needs = goalEditMaterialNeeds(rankGoal, null, catalog, {
      character: hero("Stone2", [0, 1, 2, 3, 4, 5]),
    })

    expect(needs.every((need) => need.missing === 0)).toBe(true)
  })

  it("leaves nothing to farm once the synced rank reaches the target", () => {
    expect(
      goalEditMaterialNeeds(rankGoal, null, catalog, {
        character: hero("Stone3"),
      })
    ).toEqual([])
  })
})
