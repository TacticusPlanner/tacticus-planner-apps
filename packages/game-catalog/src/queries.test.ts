import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import {
  catalogDbName,
  replaceGameCatalogDataset,
} from "./game-catalog-storage"
import {
  getAscensionCosts,
  getAscensionCostsMap,
  getCampaignBattles,
  getCampaignDefinitions,
  getCharacters,
  getCharactersMap,
  getEquipment,
  getEquipmentMap,
  getEventsActiveNow,
  getMows,
  getMowsMap,
  getOnslaughtRewards,
  getUnlockShardCosts,
  getUnlockShardCostsMap,
  getUpgrades,
} from "./queries"

function resetDb() {
  return Dexie.delete(catalogDbName)
}

function metadata(key: string) {
  return {
    key,
    hash: `${key}-h1`,
    catalogVersion: "dev-1",
    gameVersion: "1.40",
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  }
}

describe("named dataset queries", () => {
  beforeEach(async () => {
    await resetDb()
  })

  it("getCharacters/getCharactersMap round-trip", async () => {
    await replaceGameCatalogDataset(
      "characters",
      [{ id: "emperLucius", name: "Lucius" }],
      metadata("characters")
    )

    expect(await getCharacters()).toHaveLength(1)
    const byId = await getCharactersMap()
    expect(byId.get("emperLucius")?.name).toBe("Lucius")
  })

  it("getMows/getMowsMap round-trip", async () => {
    await replaceGameCatalogDataset(
      "mows",
      [{ id: "tauBroadside", name: "Broadside" }],
      metadata("mows")
    )

    expect(await getMows()).toHaveLength(1)
    const byId = await getMowsMap()
    expect(byId.get("tauBroadside")?.name).toBe("Broadside")
  })

  it("getAscensionCosts/getAscensionCostsMap round-trip, keyed by progression step", async () => {
    await replaceGameCatalogDataset(
      "ascension-costs",
      [{ progression: "Common:Stone1", orbs: 1 }],
      metadata("ascension-costs")
    )

    expect(await getAscensionCosts()).toHaveLength(1)
    const byId = await getAscensionCostsMap()
    expect(byId.get("Common:Stone1")?.orbs).toBe(1)
  })

  it("getUnlockShardCosts/getUnlockShardCostsMap round-trip, keyed by rarity", async () => {
    await replaceGameCatalogDataset(
      "unlock-shard-costs",
      [{ rarity: "Common", shards: 40 }],
      metadata("unlock-shard-costs")
    )

    expect(await getUnlockShardCosts()).toHaveLength(1)
    const byId = await getUnlockShardCostsMap()
    expect(byId.get("Common")?.shards).toBe(40)
  })

  it("getOnslaughtRewards returns stored records", async () => {
    await replaceGameCatalogDataset(
      "onslaught-rewards",
      [{ id: "sector1-tier1", regular: [] }],
      metadata("onslaught-rewards")
    )

    expect(await getOnslaughtRewards()).toHaveLength(1)
  })

  it("getUpgrades returns stored records", async () => {
    await replaceGameCatalogDataset(
      "upgrades",
      [{ id: "upgBase001", name: "Basic Upgrade" }],
      metadata("upgrades")
    )

    expect(await getUpgrades()).toHaveLength(1)
  })

  it("getEquipment/getEquipmentMap round-trip", async () => {
    await replaceGameCatalogDataset(
      "equipment",
      [{ id: "eq1", name: "Test Item" }],
      metadata("equipment")
    )

    expect(await getEquipment()).toHaveLength(1)
    const byId = await getEquipmentMap()
    expect(byId.get("eq1")?.name).toBe("Test Item")
  })

  it("getCampaignBattles returns stored records", async () => {
    await replaceGameCatalogDataset(
      "campaign-battles",
      [{ id: "battle1", campaignGroupId: "group1" }],
      metadata("campaign-battles")
    )

    expect(await getCampaignBattles()).toHaveLength(1)
  })

  it("getCampaignDefinitions round-trips, keyed by groupId", async () => {
    await replaceGameCatalogDataset(
      "campaign-definitions",
      [{ groupId: "group1", battleIds: ["battle1"] }],
      metadata("campaign-definitions")
    )

    const definitions = await getCampaignDefinitions()
    expect(definitions).toHaveLength(1)
    expect(definitions[0]?.id).toBe("group1")
  })

  it("getEventsActiveNow reflects events active at the current instant", async () => {
    const now = new Date()
    const start = new Date(now.getTime() - 60_000).toISOString()
    const end = new Date(now.getTime() + 60_000).toISOString()

    await replaceGameCatalogDataset(
      "events-calendar",
      {
        [start.slice(0, 10)]: [
          {
            occurrenceId: "occ-now",
            definitionId: "hse-warp-surge",
            confirmed: true,
            startUtc: start,
            endUtc: end,
            parameters: null,
          },
        ],
      },
      metadata("events-calendar")
    )

    const active = await getEventsActiveNow()
    expect(active).toHaveLength(1)
    expect(active[0]?.occurrenceId).toBe("occ-now")
  })
})
