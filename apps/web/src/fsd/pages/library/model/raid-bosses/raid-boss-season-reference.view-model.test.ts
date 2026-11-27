import { describe, expect, it } from "vitest"

import type { RaidBossSeasonBoard } from "@/entities/raid-boss"

import { buildRaidBossSeasonReferenceViewModel } from "./raid-boss-season-reference.view-model"

const board = {
  seasonId: "season-2",
  tiers: [
    {
      tier: 6,
      sets: [
        {
          set: 3,
          encounters: [
            {
              seasonId: "season-2",
              tier: 6,
              set: 3,
              encounterIndex: 0,
              encounter: { unitSetId: "prime" },
              setEncounters: [],
            },
            {
              seasonId: "season-2",
              tier: 6,
              set: 3,
              encounterIndex: 1,
              encounter: { unitSetId: "boss" },
              setEncounters: [],
            },
          ],
        },
      ],
    },
  ],
} as unknown as RaidBossSeasonBoard

describe("buildRaidBossSeasonReferenceViewModel", () => {
  it("puts the boss first, names the set by it and attaches the portrait fallback", () => {
    const viewModel = buildRaidBossSeasonReferenceViewModel(
      board,
      new Map([
        [
          "prime",
          {
            unitSetId: "prime",
            kind: "prime",
            isPrimarch: true,
            factionId: "Orks",
            name: "Gibbascrapz",
          },
        ],
        [
          "boss",
          {
            unitSetId: "boss",
            kind: "boss",
            isPrimarch: false,
            factionId: "Tyranids",
            name: "Tervigon",
            portraitSrc: "/boss.webp",
          },
        ],
      ])
    )

    const set = viewModel.tiers[0]?.sets[0]
    const cards = set?.encounters
    expect(cards?.map((card) => card.encounterIndex)).toEqual([1, 0])
    expect(set).toMatchObject({ setNumber: 4, bossName: "Tervigon" })
    expect(cards?.[0]?.item).toMatchObject({
      name: "Tervigon",
      portraitSrc: "/boss.webp",
    })
    expect(cards?.[1]?.item.name).toBe("Gibbascrapz")
    expect(cards?.[1]?.item.portraitSrc).toBeUndefined()
    // Tier 6 is past Mythic: no rarity to name it by.
    expect(viewModel.tiers[0]?.rarity).toBeUndefined()
  })
})

describe("season board order and rarity", () => {
  it("names each tier by its rarity and lists sets in play order", () => {
    const viewModel = buildRaidBossSeasonReferenceViewModel(
      {
        seasonId: "s",
        tiers: [
          {
            tier: 5,
            sets: [
              { set: 1, encounters: [] },
              { set: 0, encounters: [] },
            ],
          },
          { tier: 0, sets: [] },
        ],
      } as unknown as RaidBossSeasonBoard,
      new Map()
    )
    expect(viewModel.tiers.map((tier) => tier.rarity)).toEqual([
      "Mythic",
      "Common",
    ])
    expect(viewModel.tiers[0]?.sets.map((set) => set.setNumber)).toEqual([1, 2])
  })
})
