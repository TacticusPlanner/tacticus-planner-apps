import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import {
  catalogDbName,
  replaceGameCatalogDataset,
} from "./game-catalog-storage"
import { getRaidBossRoster, getRaidBosses } from "./queries"

function resetDb() {
  return Dexie.delete(catalogDbName)
}

function metadata(key: string) {
  return {
    key,
    hash: `${key}-h1`,
    catalogVersion: "dev-1",
    gameVersion: "1.42",
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
  }
}

const unit = (
  unitSetId: string,
  kind: "boss" | "prime",
  isPrimarch = false
) => ({
  unitSetId,
  kind,
  isPrimarch,
  factionId: "Tyranids",
  movement: 4,
  statProgression: [
    {
      health: 1000,
      damage: 10,
      fixedArmor: 5,
      rank: 0,
      starLevel: 0,
      baseRarity: "Common",
      progressionIndex: 0,
      abilityLevel: 1,
    },
  ],
})

const payload = {
  seasonConfigRotation: ["season-1", "season-2"],
  bosses: [
    unit("GuildBoss1Boss1Tervigon", "boss"),
    unit("GuildBoss5Boss1Mortarion", "boss", true),
  ],
  primes: [unit("GuildBoss1MiniBoss1Warrior", "prime")],
  seasons: {
    "season-1": {
      seasonConfigId: "season-1",
      tiers: [
        {
          tier: 6,
          sets: [
            {
              set: 0,
              chestId: "chest-0",
              guildXp: 100,
              encounters: [
                {
                  encounterIndex: 0,
                  encounterType: "Boss",
                  boardId: "GB_01",
                  maxNrOfTurns: 6,
                  unitSetId: "GuildBoss1Boss1Tervigon",
                  progressionIndex: 3,
                  fieldNpcIds: ["GuildBoss1Npc1Termagant"],
                  disallowedFactionIds: ["Tyranids"],
                  modifiers: [
                    {
                      hpLost: 25,
                      modifierId: "mod-a",
                      type: "bossStatDecrease",
                      target: "movement",
                      amount: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}

describe("raid-bosses queries", () => {
  beforeEach(async () => {
    await resetDb()
  })

  it("returns null before the dataset has synced", async () => {
    expect(await getRaidBosses()).toBeNull()
    expect(await getRaidBossRoster()).toBeNull()
  })

  it("stores the whole payload as one row and reads it back", async () => {
    await replaceGameCatalogDataset(
      "raid-bosses",
      payload,
      metadata("raid-bosses")
    )

    const raidBosses = await getRaidBosses()
    expect(raidBosses?.id).toBe("raid-bosses")
    expect(raidBosses?.seasonConfigRotation).toEqual(["season-1", "season-2"])
    expect(raidBosses?.bosses).toHaveLength(2)
    expect(
      raidBosses?.seasons["season-1"].tiers[0].sets[0].encounters[0]
        .progressionIndex
    ).toBe(3)
  })

  it("splits bosses and primes and indexes every unit by id", async () => {
    await replaceGameCatalogDataset(
      "raid-bosses",
      payload,
      metadata("raid-bosses")
    )

    const roster = await getRaidBossRoster()
    expect(roster?.bosses.map((b) => b.unitSetId)).toEqual([
      "GuildBoss1Boss1Tervigon",
      "GuildBoss5Boss1Mortarion",
    ])
    expect(roster?.primes.map((p) => p.unitSetId)).toEqual([
      "GuildBoss1MiniBoss1Warrior",
    ])
    expect(roster?.byId.get("GuildBoss1MiniBoss1Warrior")?.kind).toBe("prime")
    expect(roster?.byId.get("GuildBoss5Boss1Mortarion")?.isPrimarch).toBe(true)
    expect(roster?.byId.get("nope")).toBeUndefined()
  })
})
