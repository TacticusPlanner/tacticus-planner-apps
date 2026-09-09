import { describe, expect, it } from "vitest"

import {
  buildRaidBossSeasonBoard,
  encounterProgressionStepIndex,
  resolveRaidBossEncounterLocation,
  resolveRaidBossSeasonId,
} from "./season-reference"
import type { RaidBossesPayload } from "../model/types"

const encounter = (unitSetId: string, encounterIndex: number) => ({
  encounterIndex,
  encounterType: encounterIndex === 1 ? "Crystal" : "Boss",
  boardId: "board",
  maxNrOfTurns: 6,
  unitSetId,
  progressionIndex: encounterIndex + 1,
  fieldNpcIds: [],
  disallowedFactionIds: [],
  modifiers: [],
})

const payload = {
  seasonConfigRotation: ["s2", "s1", "missing"],
  bosses: [],
  primes: [],
  seasons: {
    s1: {
      seasonConfigId: "s1",
      tiers: [
        {
          tier: 1,
          sets: [
            {
              set: 1,
              chestId: "a",
              guildXp: 1,
              encounters: [encounter("a", 0)],
            },
          ],
        },
        {
          tier: 4,
          sets: [
            {
              set: 2,
              chestId: "b",
              guildXp: 1,
              encounters: [encounter("b", 0)],
            },
          ],
        },
      ],
    },
    s2: {
      seasonConfigId: "s2",
      tiers: [
        {
          tier: 3,
          sets: [
            {
              set: 1,
              chestId: "one",
              guildXp: 1,
              encounters: [encounter("boss-1", 0)],
            },
            {
              set: 4,
              chestId: "four",
              guildXp: 1,
              encounters: [encounter("prime-1", 1), encounter("boss-2", 0)],
            },
          ],
        },
      ],
    },
  },
} as unknown as RaidBossesPayload

describe("season reference", () => {
  it("uses the first valid rotation season and projects descending tiers/sets without reordering encounters", () => {
    expect(resolveRaidBossSeasonId(payload)).toBe("s2")
    expect(resolveRaidBossSeasonId(payload, "s1")).toBe("s1")
    const board = buildRaidBossSeasonBoard(payload, "s2")!
    expect(board.tiers[0]?.sets.map((set) => set.set)).toEqual([4, 1])
    expect(
      board.tiers[0]?.sets[0]?.encounters.map(
        (item) => item.encounter.unitSetId
      )
    ).toEqual(["prime-1", "boss-2"])
  })

  it("rejects a partial or mismatched location and clamps an encounter step", () => {
    expect(
      resolveRaidBossEncounterLocation(payload, "boss-2", {
        seasonId: "s2",
        tier: 3,
        set: 4,
        encounterIndex: 0,
      })?.encounter.unitSetId
    ).toBe("boss-2")
    expect(
      resolveRaidBossEncounterLocation(payload, "boss-2", {
        seasonId: "s2",
        tier: 3,
        set: 4,
        encounterIndex: 1,
      })
    ).toBeUndefined()
    expect(encounterProgressionStepIndex(8, 4)).toBe(3)
    expect(encounterProgressionStepIndex(0, 4)).toBe(0)
  })
})
