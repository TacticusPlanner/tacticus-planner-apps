import { describe, expect, it } from "vitest"

import {
  buildAdjustedView,
  buildModifierContext,
  fieldNpcIdsForStep,
  findEncountersForUnit,
  maxKnownProgressionIndex,
} from "./encounters"
import type { RaidBoss, RaidBossesPayload } from "../model/types"

function encounter(
  unitSetId: string,
  progressionIndex: number,
  over: Record<string, unknown> = {}
) {
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
    ...over,
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

const boss = (kind: RaidBoss["kind"], unitSetId: string): RaidBoss =>
  ({ unitSetId, kind, statProgression: [] }) as unknown as RaidBoss

const mod = (over: Record<string, unknown> = {}) => ({
  hpLost: 100,
  modifierId: "m",
  type: "bossStatDecrease",
  target: "movement",
  amount: 1,
  ...over,
})

const withPrimes: RaidBossesPayload = {
  seasonConfigRotation: ["s1"],
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
              encounters: [
                encounter("the-boss", 3, {
                  encounterType: "Boss",
                  fieldNpcIds: ["npc-x"],
                }),
                encounter("prime-b", 3, {
                  encounterType: "Crystal",
                  encounterIndex: 2,
                  modifiers: [mod({ modifierId: "b" })],
                }),
                encounter("prime-a", 3, {
                  encounterType: "Crystal",
                  encounterIndex: 1,
                  modifiers: [mod({ modifierId: "a" })],
                }),
              ],
            },
          ],
        },
      ],
    },
  },
}

describe("buildModifierContext", () => {
  it("for a boss, returns the set's Crystal primes in encounterIndex order with resolved names", () => {
    const ctx = buildModifierContext(
      withPrimes,
      boss("boss", "the-boss"),
      2,
      (id) => `name:${id}`
    )
    expect(ctx).toEqual({
      kind: "boss",
      primes: [
        {
          unitSetId: "prime-a",
          name: "name:prime-a",
          modifiers: [mod({ modifierId: "a" })],
        },
        {
          unitSetId: "prime-b",
          name: "name:prime-b",
          modifiers: [mod({ modifierId: "b" })],
        },
      ],
    })
  })

  it("for a prime, returns its own modifiers", () => {
    const ctx = buildModifierContext(
      withPrimes,
      boss("prime", "prime-a"),
      2,
      (id) => id
    )
    expect(ctx).toEqual({
      kind: "prime",
      modifiers: [mod({ modifierId: "a" })],
    })
  })

  it("returns none when the unit has no encounter", () => {
    expect(
      buildModifierContext(withPrimes, boss("boss", "nope"), 0, (id) => id)
    ).toEqual({ kind: "none" })
  })
})

describe("fieldNpcIdsForStep", () => {
  it("returns the representative encounter's field npc ids", () => {
    expect(fieldNpcIdsForStep(withPrimes, "the-boss", 2)).toEqual(["npc-x"])
    expect(fieldNpcIdsForStep(withPrimes, "nope", 0)).toEqual([])
  })
})

describe("buildAdjustedView", () => {
  const prime = (unitSetId: string, health: number): RaidBoss =>
    ({
      unitSetId,
      kind: "prime",
      statProgression: [{ health }],
    }) as unknown as RaidBoss

  // Boss set with two Crystal primes, each carrying two modifiers at different HP-lost thresholds.
  const adjPayload: RaidBossesPayload = {
    seasonConfigRotation: ["s1"],
    bosses: [],
    primes: [prime("prime-a", 200), prime("prime-b", 400)],
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
                encounters: [
                  encounter("the-boss", 1, {
                    encounterType: "Boss",
                    fieldNpcIds: ["ripper", "ripper", "grot"],
                  }),
                  encounter("prime-a", 1, {
                    encounterType: "Crystal",
                    encounterIndex: 1,
                    modifiers: [
                      {
                        hpLost: 1,
                        modifierId: "a1",
                        type: "bossStatPctDecrease",
                        target: "dmg",
                        amount: 30,
                      },
                      {
                        hpLost: 2,
                        modifierId: "a2",
                        type: "unitAmountDecrease",
                        target: "unitId",
                        subtarget: "ripper",
                        amount: 1,
                      },
                    ],
                  }),
                  encounter("prime-b", 1, {
                    encounterType: "Crystal",
                    encounterIndex: 2,
                    modifiers: [
                      {
                        hpLost: 1,
                        modifierId: "b1",
                        type: "bossStatDecrease",
                        target: "movement",
                        amount: 1,
                      },
                    ],
                  }),
                ],
              },
            ],
          },
        ],
      },
    },
  }

  it("returns null for a prime and for a boss with no encounter", () => {
    expect(
      buildAdjustedView(adjPayload, prime("prime-a", 200), 0, {})
    ).toBeNull()
    expect(
      buildAdjustedView(adjPayload, boss("boss", "nope"), 0, {})
    ).toBeNull()
  })

  it("builds one panel per Crystal prime, keyed by encounterIndex, rescaled to that prime's step HP", () => {
    const view = buildAdjustedView(adjPayload, boss("boss", "the-boss"), 0, {})!
    expect(view.primes.map((p) => p.id)).toEqual(["1", "2"])
    expect(view.primes.map((p) => p.unitSetId)).toEqual(["prime-a", "prime-b"])
    // prime-a: 2 modifiers, health 200 -> thresholds [100, 200]; options prepend 0
    expect(view.primes[0].hpLostPoints).toEqual([0, 100, 200])
    // prime-b: 1 modifier, health 400 -> [400]
    expect(view.primes[1].hpLostPoints).toEqual([0, 400])
  })

  it("full HP (no selection) leaves nothing active and no adjustment", () => {
    const view = buildAdjustedView(adjPayload, boss("boss", "the-boss"), 0, {})!
    expect(view.activeModifiers).toHaveLength(0)
    expect(view.statAdjustments).toEqual({ pctByStat: {}, flatByStat: {} })
    expect(view.enemies.ids).toEqual(["ripper", "ripper", "grot"])
    expect(view.enemies.removed).toEqual([])
  })

  it("combines active modifiers across primes and applies unit removals", () => {
    const view = buildAdjustedView(adjPayload, boss("boss", "the-boss"), 0, {
      "1": 200, // both prime-a (encounterIndex 1) modifiers active (thresholds 100 & 200)
      "2": 400, // prime-b (encounterIndex 2) modifier active
    })!
    expect(view.activeModifiers.map((m) => m.modifierId).sort()).toEqual([
      "a1",
      "a2",
      "b1",
    ])
    expect(view.statAdjustments).toEqual({
      pctByStat: { dmg: -30 },
      flatByStat: { movement: -1 },
    })
    expect(view.enemies.ids).toEqual(["ripper", "grot"])
    expect(view.enemies.removed).toEqual([{ unitSetId: "ripper", count: 1 }])
  })
})
