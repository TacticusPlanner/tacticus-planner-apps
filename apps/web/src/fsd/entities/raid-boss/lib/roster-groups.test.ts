import { describe, expect, it } from "vitest"

import { buildRaidBossRosterGroups } from "./roster-groups"
import type { RaidBoss, RaidBossesPayload } from "../model/types"

// Fixture shaped after the real served dataset (raid-boss-season-1.json / raid-boss-1-*.json in
// tacticus-planner-api): Tervigon Leviathan's set has two Crystal encounters that both reference the
// same prime (Warrior Leviathan), the way the real boss's two support boards do; Ghazghkull's set
// references its own distinct prime, so the two groups don't overlap.
function boss(unitSetId: string, kind: RaidBoss["kind"] = "boss"): RaidBoss {
  return {
    unitSetId,
    kind,
    isPrimarch: false,
    factionId: kind === "boss" ? "Tyranids" : "Orks",
    movement: 4,
    statProgression: [],
  } as unknown as RaidBoss
}

function encounter(
  unitSetId: string,
  encounterType: "Boss" | "Crystal",
  encounterIndex: number
) {
  return {
    encounterIndex,
    encounterType,
    boardId: "GB_01",
    maxNrOfTurns: 6,
    unitSetId,
    progressionIndex: 1,
    fieldNpcIds: [],
    disallowedFactionIds: [],
    modifiers: [],
  }
}

const payload: RaidBossesPayload = {
  seasonConfigRotation: ["s1"],
  bosses: [
    boss("GuildBoss1Boss1TyranTervigonLeviathan"),
    boss("GuildBoss4Boss1OrksGhazghkull"),
  ],
  primes: [
    boss("GuildBoss1MiniBoss1TyranWarriorLeviathan", "prime"),
    boss("GuildBoss4MiniBoss1OrksBigMek", "prime"),
  ],
  seasons: {
    s1: {
      seasonConfigId: "s1",
      tiers: [
        {
          tier: 0,
          sets: [
            {
              set: 0,
              chestId: "chest-0",
              guildXp: 10,
              encounters: [
                encounter("GuildBoss1Boss1TyranTervigonLeviathan", "Boss", 0),
                encounter(
                  "GuildBoss1MiniBoss1TyranWarriorLeviathan",
                  "Crystal",
                  1
                ),
                encounter(
                  "GuildBoss1MiniBoss1TyranWarriorLeviathan",
                  "Crystal",
                  2
                ),
              ],
            },
          ],
        },
        {
          // Same boss reappears at a higher tier/progression step, same prime — the dedup must hold
          // across sets too, not just within one.
          tier: 5,
          sets: [
            {
              set: 0,
              chestId: "chest-1",
              guildXp: 20,
              encounters: [
                encounter("GuildBoss1Boss1TyranTervigonLeviathan", "Boss", 0),
                encounter(
                  "GuildBoss1MiniBoss1TyranWarriorLeviathan",
                  "Crystal",
                  1
                ),
                encounter(
                  "GuildBoss1MiniBoss1TyranWarriorLeviathan",
                  "Crystal",
                  2
                ),
              ],
            },
          ],
        },
        {
          tier: 24,
          sets: [
            {
              set: 0,
              chestId: "chest-2",
              guildXp: 30,
              encounters: [
                encounter("GuildBoss4Boss1OrksGhazghkull", "Boss", 0),
                encounter("GuildBoss4MiniBoss1OrksBigMek", "Crystal", 1),
              ],
            },
          ],
        },
      ],
    },
  },
}

describe("buildRaidBossRosterGroups", () => {
  it("groups Tervigon Leviathan with its deduped Warrior Leviathan prime", () => {
    const groups = buildRaidBossRosterGroups(payload)
    const tervigon = groups.find(
      (group) =>
        group.boss.unitSetId === "GuildBoss1Boss1TyranTervigonLeviathan"
    )

    expect(tervigon?.primes.map((prime) => prime.unitSetId)).toEqual([
      "GuildBoss1MiniBoss1TyranWarriorLeviathan",
    ])
  })

  it("returns one group per served boss, in served order", () => {
    const groups = buildRaidBossRosterGroups(payload)

    expect(groups.map((group) => group.boss.unitSetId)).toEqual([
      "GuildBoss1Boss1TyranTervigonLeviathan",
      "GuildBoss4Boss1OrksGhazghkull",
    ])
  })

  it("places every payload.primes id in exactly one group", () => {
    const groups = buildRaidBossRosterGroups(payload)
    const counts = new Map<string, number>()

    for (const group of groups) {
      for (const prime of group.primes) {
        counts.set(prime.unitSetId, (counts.get(prime.unitSetId) ?? 0) + 1)
      }
    }

    for (const prime of payload.primes) {
      expect(counts.get(prime.unitSetId)).toBe(1)
    }
  })
})
