import { describe, expect, it } from "vitest"

import {
  aggregateBaseUpgrades,
  groupUpgradesByRank,
  rankUpUpgradeIds,
  type CharacterLike,
  type UpgradeLike,
} from "./rank-lookup-calc"

// 6 upgrades per rank, ordered [Health, Health, Damage, Damage, Armour, Armour] — point-five takes
// indices 0/2/4 (the first of each stat pair).
const character: CharacterLike = {
  id: "astarCyrus",
  name: "Cyrus",
  rankUpUpgrades: [
    { rank: "Stone1", upgradeIds: ["h1", "h2", "d1", "d2", "a1", "a2"] },
    { rank: "Stone2", upgradeIds: ["h3", "h4", "d3", "d4", "a3", "a4"] },
    { rank: "Stone3", upgradeIds: ["h5", "h6", "d5", "d6", "a5", "a6"] },
  ],
}

describe("rankUpUpgradeIds", () => {
  it("flattens upgrades across the range (end exclusive)", () => {
    expect(rankUpUpgradeIds(character, "Stone1", "Stone3", false)).toEqual([
      "h1",
      "h2",
      "d1",
      "d2",
      "a1",
      "a2",
      "h3",
      "h4",
      "d3",
      "d4",
      "a3",
      "a4",
    ])
  })

  it("returns [] for an empty or inverted range", () => {
    expect(rankUpUpgradeIds(character, "Stone2", "Stone2", false)).toEqual([])
    expect(rankUpUpgradeIds(character, "Stone3", "Stone1", false)).toEqual([])
  })

  it("adds the first of each stat pair at the target rank when point-five is on", () => {
    expect(rankUpUpgradeIds(character, "Stone1", "Stone2", true)).toEqual([
      "h1",
      "h2",
      "d1",
      "d2",
      "a1",
      "a2", // Stone1 -> Stone2
      "h3",
      "d3",
      "a3", // point-five of Stone2 (indices 0/2/4)
    ])
  })

  it("adds nothing extra when the target rank has no upgrade entry", () => {
    // Iron1 is not in the fixture, so point-five contributes nothing beyond the plain range.
    expect(rankUpUpgradeIds(character, "Stone1", "Iron1", true)).toEqual(
      rankUpUpgradeIds(character, "Stone1", "Iron1", false)
    )
  })
})

describe("groupUpgradesByRank", () => {
  it("produces one group per rank step with a point-five group at the end", () => {
    const groups = groupUpgradesByRank(character, "Stone1", "Stone2", true)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({ fromRank: "Stone1", toRank: "Stone2" })
    expect(groups[1]).toMatchObject({
      fromRank: "Stone2",
      toRank: "Stone2",
      pointFive: true,
      upgradeIds: ["h3", "d3", "a3"],
    })
  })
})

describe("aggregateBaseUpgrades", () => {
  const upgrades = new Map<string, UpgradeLike>([
    [
      "base1",
      {
        id: "base1",
        label: "Base 1",
        rarity: "Common",
        stat: "Health",
        composite: false,
        recipe: [],
      },
    ],
    [
      "base2",
      {
        id: "base2",
        label: "Base 2",
        rarity: "Common",
        stat: "Damage",
        composite: false,
        recipe: [],
      },
    ],
    [
      "craft1",
      {
        id: "craft1",
        label: "Craft 1",
        rarity: "Rare",
        stat: "Health",
        composite: true,
        recipe: [
          { material: "base1", count: 2 },
          { material: "craft2", count: 1 },
        ],
      },
    ],
    [
      "craft2",
      {
        id: "craft2",
        label: "Craft 2",
        rarity: "Uncommon",
        stat: "Health",
        composite: true,
        recipe: [{ material: "base2", count: 3 }],
      },
    ],
  ])

  it("expands composite upgrades recursively and sums base counts", () => {
    // craft1 = 2×base1 + 1×craft2(=3×base2); plus a standalone base1.
    const result = aggregateBaseUpgrades(["craft1", "base1"], upgrades)
    const byId = Object.fromEntries(result.map((r) => [r.id, r.count]))
    expect(byId).toEqual({ base1: 3, base2: 3 })
  })

  it("treats unknown ids as base upgrades", () => {
    expect(aggregateBaseUpgrades(["mystery"], upgrades)).toEqual([
      { id: "mystery", count: 1 },
    ])
  })
})
