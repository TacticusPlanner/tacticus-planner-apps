import { describe, expect, it } from "vitest"

import { buildCreateGoalSnapshot } from "./goal-snapshot-builder"
import type { CombinedGoalSpec } from "./types"

const rankSpec = { goalType: "Rank", config: {} } as CombinedGoalSpec

const build = (
  missingUpgrades: Parameters<
    typeof buildCreateGoalSnapshot
  >[0]["missingUpgrades"],
  spec: CombinedGoalSpec = rankSpec
) =>
  buildCreateGoalSnapshot({
    spec,
    entityType: "Character",
    playerEntity: undefined,
    playerCharacter: undefined,
    currentActiveAbility: 1,
    currentPassiveAbility: 1,
    missingUpgrades,
  })

describe("buildCreateGoalSnapshot", () => {
  it("sends each resource id once, trimmed, dropping blank and over-long ids", () => {
    const snapshot = build([
      { id: "upgA", required: 3, inventoryContribution: 1 },
      { id: " upgA ", required: 9, inventoryContribution: 9 },
      { id: " ", required: 1, inventoryContribution: 0 },
      { id: "x".repeat(129), required: 1, inventoryContribution: 0 },
      { id: "upgB", required: 2, inventoryContribution: 0 },
    ])

    expect(snapshot.initialRequirement).toEqual([
      { resourceId: "upgA", count: 3 },
      { resourceId: "upgB", count: 2 },
    ])
    expect(snapshot.initialInventoryContribution).toEqual([
      { resourceId: "upgA", count: 1 },
    ])
  })

  it("caps a resource list at 250 entries", () => {
    const snapshot = build(
      Array.from({ length: 300 }, (_, index) => ({
        id: `upg${index}`,
        required: 1,
        inventoryContribution: 1,
      }))
    )

    expect(snapshot.initialRequirement).toHaveLength(250)
    expect(snapshot.initialInventoryContribution).toHaveLength(250)
  })

  it("records no resources for a goal type that does not own the preview", () => {
    const snapshot = build(
      [{ id: "upgA", required: 3, inventoryContribution: 1 }],
      { goalType: "Ascension", config: {} } as CombinedGoalSpec
    )

    expect(snapshot.initialRequirement).toEqual([])
    expect(snapshot.initialInventoryContribution).toEqual([])
  })
})
