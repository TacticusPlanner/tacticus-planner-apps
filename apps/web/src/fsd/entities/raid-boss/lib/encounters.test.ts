import { describe, expect, it } from "vitest"

import { findEncountersForUnit, maxKnownProgressionIndex } from "./encounters"
import type { RaidBossesPayload } from "../model/types"

function encounter(unitSetId: string, progressionIndex: number) {
  return {
    encounterIndex: 0,
    encounterType: "Boss",
    boardId: "GB_01",
    maxNrOfTurns: 6,
    unitSetId,
    progressionIndex,
    fieldNpcIds: [],
    disallowedFactionIds: [],
    modifiers: [],
  }
}

const payload: RaidBossesPayload = {
  seasonConfigRotation: ["s1", "s2"],
  bosses: [],
  primes: [],
  seasons: {
    s1: {
      seasonConfigId: "s1",
      tiers: [
        {
          tier: 6,
          sets: [
            {
              set: 0,
              chestId: "c0",
              guildXp: 1,
              encounters: [encounter("boss-a", 2)],
            },
            {
              set: 1,
              chestId: "c1",
              guildXp: 1,
              encounters: [encounter("boss-a", 5), encounter("boss-b", 1)],
            },
          ],
        },
      ],
    },
    s2: {
      seasonConfigId: "s2",
      tiers: [
        {
          tier: 5,
          sets: [
            {
              set: 0,
              chestId: "c2",
              guildXp: 1,
              encounters: [encounter("boss-a", 8)],
            },
          ],
        },
      ],
    },
  },
}

describe("findEncountersForUnit", () => {
  it("collects every encounter across seasons/tiers/sets that targets the unit", () => {
    expect(findEncountersForUnit(payload, "boss-a")).toHaveLength(3)
    expect(findEncountersForUnit(payload, "boss-b")).toHaveLength(1)
    expect(findEncountersForUnit(payload, "nope")).toHaveLength(0)
  })
})

describe("maxKnownProgressionIndex", () => {
  it("uses the highest encounter progression index, converted to a 0-based ladder index and clamped", () => {
    // highest is 8 (1-based) -> 7 (0-based), clamped to ladder length 10 -> 7
    expect(maxKnownProgressionIndex(payload, "boss-a", 10)).toBe(7)
    // clamped down to the last ladder step when the ladder is shorter
    expect(maxKnownProgressionIndex(payload, "boss-a", 4)).toBe(3)
  })

  it("returns 0 when the unit is never fought", () => {
    expect(maxKnownProgressionIndex(payload, "nope", 9)).toBe(0)
  })
})
