import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"

import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  appliedUpgradeIds,
  groupUpgradesByRank,
  rankUpUpgradeIds,
  type Character,
  type Upgrade,
} from "./rank-lookup-calc"

const upgradeId = upgradeIdSchema.parse
const upgradeIds = (values: string[]) => values.map((value) => upgradeId(value))

// 6 upgrades per rank, ordered [Health, Health, Damage, Damage, Armour, Armour] — point-five takes
// indices 0/2/4 (the first of each stat pair).
const character: Character = {
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

  it("returns [] for an empty clean target or inverted range", () => {
    expect(rankUpUpgradeIds(character, "Stone2", "Stone2", false)).toEqual([])
    expect(rankUpUpgradeIds(character, "Stone3", "Stone1", false)).toEqual([])
  })

  it("includes a partial target at the starting rank", () => {
    expect(
      rankUpUpgradeIds(character, "Stone2", "Stone2", false, 0, 2)
    ).toEqual(["h3", "d3"])
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

  it("adds the first N of the top-row subset at the target rank when topRowCount is set", () => {
    // topRowCount picks from the *top row* [h3, d3, a3] (indices 0/2/4), not a raw prefix of the
    // 6-element list — 2 of it is [h3, d3] (Health then Damage), never [h3, h4].
    expect(
      rankUpUpgradeIds(character, "Stone1", "Stone2", false, 0, 1)
    ).toEqual(["h1", "h2", "d1", "d2", "a1", "a2", "h3"])
    expect(
      rankUpUpgradeIds(character, "Stone1", "Stone2", false, 0, 2)
    ).toEqual(["h1", "h2", "d1", "d2", "a1", "a2", "h3", "d3"])
    // 3 of 3 matches plain point-five exactly.
    expect(
      rankUpUpgradeIds(character, "Stone1", "Stone2", false, 0, 3)
    ).toEqual(rankUpUpgradeIds(character, "Stone1", "Stone2", true))
  })

  it("prefers topRowCount over appliedUpgrades over pointFive when more than one is set", () => {
    expect(rankUpUpgradeIds(character, "Stone1", "Stone2", true, 4, 1)).toEqual(
      ["h1", "h2", "d1", "d2", "a1", "a2", "h3"]
    )
    expect(rankUpUpgradeIds(character, "Stone1", "Stone2", true, 4, 0)).toEqual(
      ["h1", "h2", "d1", "d2", "a1", "a2", "h3", "h4", "d3", "d4"]
    )
  })
})

describe("groupUpgradesByRank", () => {
  it("creates a partial-only group at the starting rank", () => {
    expect(
      groupUpgradesByRank(character, "Stone2", "Stone2", false, 0, 2)
    ).toEqual([
      {
        fromRank: "Stone2",
        toRank: "Stone2",
        pointFive: true,
        upgradeIds: ["h3", "d3"],
      },
    ])
  })

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

  it("produces a partial group from the top-row subset when topRowCount is set", () => {
    const groups = groupUpgradesByRank(
      character,
      "Stone1",
      "Stone2",
      false,
      0,
      2
    )
    expect(groups).toHaveLength(2)
    expect(groups[1]).toMatchObject({
      fromRank: "Stone2",
      toRank: "Stone2",
      pointFive: true,
      upgradeIds: ["h3", "d3"],
    })
  })
})

describe("aggregateBaseUpgrades", () => {
  const upgrades = new Map<ReturnType<typeof upgradeId>, Upgrade>([
    [
      upgradeId("base1"),
      {
        id: upgradeId("base1"),
        label: "Base 1",
        rarity: "Common",
        stat: "Health",
        crafted: false,
        recipe: [],
      },
    ],
    [
      upgradeId("base2"),
      {
        id: upgradeId("base2"),
        label: "Base 2",
        rarity: "Common",
        stat: "Damage",
        crafted: false,
        recipe: [],
      },
    ],
    [
      upgradeId("craft1"),
      {
        id: upgradeId("craft1"),
        label: "Craft 1",
        rarity: "Rare",
        stat: "Health",
        crafted: true,
        recipe: [
          { material: upgradeId("base1"), count: 2 },
          { material: upgradeId("craft2"), count: 1 },
        ],
      },
    ],
    [
      upgradeId("craft2"),
      {
        id: upgradeId("craft2"),
        label: "Craft 2",
        rarity: "Uncommon",
        stat: "Health",
        crafted: true,
        recipe: [{ material: upgradeId("base2"), count: 3 }],
      },
    ],
  ])

  it("expands crafted upgrades recursively and sums base counts", () => {
    // craft1 = 2×base1 + 1×craft2(=3×base2); plus a standalone base1.
    const result = aggregateBaseUpgrades(
      upgradeIds(["craft1", "base1"]),
      upgrades
    )
    const byId = Object.fromEntries(result.map((r) => [r.id, r.count]))
    expect(byId).toEqual({ base1: 3, base2: 3 })
  })

  it("treats unknown ids as base upgrades", () => {
    expect(aggregateBaseUpgrades(upgradeIds(["mystery"]), upgrades)).toEqual([
      { id: "mystery", count: 1 },
    ])
  })

  it("expands a crafted inventory entry through its recipe, combined with applied ids", () => {
    // craft2 owned ×2 = 2×3×base2 = 6×base2; plus a standalone applied base1.
    const result = aggregateOwnedBaseUpgrades(
      upgradeIds(["base1"]),
      [{ id: upgradeId("craft2"), amount: 2 }],
      upgrades
    )
    const byId = Object.fromEntries(result.map((r) => [r.id, r.count]))
    expect(byId).toEqual({ base1: 1, base2: 6 })
  })
})

describe("appliedUpgradeIds", () => {
  it("includes every upgrade for ranks strictly below the current rank", () => {
    expect(appliedUpgradeIds(character, "Stone2", [])).toEqual([
      "h1",
      "h2",
      "d1",
      "d2",
      "a1",
      "a2",
    ])
  })

  it("also includes the current rank's own upgrades at the given slot indices", () => {
    expect(appliedUpgradeIds(character, "Stone2", [0, 2])).toEqual([
      "h1",
      "h2",
      "d1",
      "d2",
      "a1",
      "a2", // Stone1 fully applied
      "h3",
      "d3", // Stone2 slots 0 and 2
    ])
  })

  it("returns [] when currentRank is the very first rank with no slots applied", () => {
    expect(appliedUpgradeIds(character, "Stone1", [])).toEqual([])
  })
})
