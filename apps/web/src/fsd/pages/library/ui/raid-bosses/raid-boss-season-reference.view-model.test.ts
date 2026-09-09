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
  it("keeps authored order while attaching the playable-prime name and portrait fallback", () => {
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
            portraitSrc: "/boss.png",
          },
        ],
      ])
    )

    const cards = viewModel.tiers[0]?.sets[0]?.encounters
    expect(cards?.map((card) => card.encounterIndex)).toEqual([0, 1])
    expect(cards?.[0]?.item.name).toBe("Gibbascrapz")
    expect(cards?.[0]?.item.portraitSrc).toBeUndefined()
    expect(cards?.[1]?.item).toMatchObject({
      name: "Tervigon",
      portraitSrc: "/boss.png",
    })
  })
})
