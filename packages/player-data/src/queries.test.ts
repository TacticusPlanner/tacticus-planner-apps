import "fake-indexeddb/auto"
import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import { playerDataDbName, replacePlayerDataChunk } from "./player-data-storage"
import type { PlayerDataChunkKey } from "./player-data.dto"
import {
  getCampaignEventProgress,
  getCampaignProgress,
  getInventoryAbilityMaterials,
  getInventoryOrbs,
  getInventoryShard,
  getInventoryUpgrades,
  getInventoryXpBooks,
  getLiveProgress,
  getPlayerCharacter,
  getPlayerCharacters,
  getPlayerDetails,
  getPlayerInventoryItems,
  getPlayerMow,
  getPlayerMows,
} from "./queries"

// The storage layer stores payloads verbatim (validation happens in the HTTP client), so these
// fixtures only carry the fields the assertions read.
const inventory = {
  xpBooks: [{ xpBookId: "xpCommon", amount: 2 }],
  abilityBadges: { imperial: [], xenos: [], chaos: [] },
  components: {
    imperial: { amount: 1 },
    xenos: { amount: 0 },
    chaos: { amount: 0 },
  },
  forgeBadges: [],
  orbs: { imperial: [{ rarity: "Rare", amount: 3 }], xenos: [], chaos: [] },
  requisitionOrdersRegular: 5,
  requisitionOrdersBlessed: 1,
  resetStones: 2,
}
const chunks: Partial<Record<PlayerDataChunkKey, unknown>> = {
  "player-details": { name: "Tester", powerLevel: 100 },
  characters: [{ unitId: "ultraTigurius", rank: "Gold1" }],
  mows: [{ unitId: "adeptRhino", shards: 4 }],
  "inventory-upgrades": [{ upgradeId: "u1", amount: 3 }],
  "inventory-items": [{ itemId: "i1", level: 1, amount: 2 }],
  "inventory-shards": [{ unitId: "necroWarden", amount: 5, mythicAmount: 0 }],
  inventory,
  "campaign-progress": [{ tacticusCampaignId: "campaign1", type: "Standard" }],
  "campaign-events-progress": [
    { tacticusCampaignId: "eventCampaign6", type: "Standard" },
  ],
  "live-progress": { battleAttempts: [], activeCampaignEventId: null },
}

async function seedAll() {
  for (const [key, data] of Object.entries(chunks)) {
    await replacePlayerDataChunk(key as PlayerDataChunkKey, data, {
      key: key as PlayerDataChunkKey,
      hash: `${key}-h1`,
      schemaVersion: 1,
      updatedAt: "2026-10-06T00:00:00Z",
    })
  }
}

const unit = (id: string) => id as UnitId

describe("player-data queries", () => {
  beforeEach(async () => {
    await Dexie.delete(playerDataDbName)
  })

  it("reads every chunk back after a sync", async () => {
    await seedAll()

    expect(await getPlayerDetails()).toEqual(chunks["player-details"])
    expect(await getPlayerCharacters()).toEqual(chunks.characters)
    expect(await getPlayerMows()).toEqual(chunks.mows)
    expect(await getInventoryUpgrades()).toEqual(chunks["inventory-upgrades"])
    expect(await getPlayerInventoryItems()).toEqual(chunks["inventory-items"])
    expect(await getCampaignProgress()).toEqual(chunks["campaign-progress"])
    expect(await getCampaignEventProgress()).toEqual(
      chunks["campaign-events-progress"]
    )
    expect(await getLiveProgress()).toEqual(chunks["live-progress"])
  })

  it("reads single records by unit id", async () => {
    await seedAll()

    expect(await getPlayerCharacter(unit("ultraTigurius"))).toMatchObject({
      rank: "Gold1",
    })
    expect(await getPlayerMow(unit("adeptRhino"))).toMatchObject({ shards: 4 })
    expect(await getInventoryShard(unit("necroWarden"))).toMatchObject({
      amount: 5,
    })
    expect(await getPlayerCharacter(unit("unknown"))).toBeUndefined()
  })

  it("pulls the inventory sub-collections out of the merged chunk", async () => {
    await seedAll()

    expect(await getInventoryXpBooks()).toEqual(inventory.xpBooks)
    expect(await getInventoryOrbs()).toEqual(inventory.orbs)
    expect(await getInventoryAbilityMaterials()).toEqual({
      abilityBadges: inventory.abilityBadges,
      forgeBadges: inventory.forgeBadges,
      components: inventory.components,
    })
  })

  it("reads undefined for chunks that have never synced", async () => {
    expect(await getPlayerCharacters()).toBeUndefined()
    expect(await getInventoryXpBooks()).toBeUndefined()
    expect(await getInventoryOrbs()).toBeUndefined()
    expect(await getInventoryAbilityMaterials()).toBeUndefined()
  })
})
