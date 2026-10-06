import "fake-indexeddb/auto"
import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import { playerDataDbName, replacePlayerDataChunk } from "./player-data-storage"
import {
  getLegendaryEventProgress,
  getLegendaryEventsProgress,
} from "./queries"

const lysanderProgress = {
  id: "astarLysander",
  alpha: { encounters: [] },
  beta: null,
  gamma: null,
  currentPoints: 3410,
  currentCurrency: 120,
  currentShards: 125,
  currentClaimedChestIndex: 4,
  currentEventRun: 1,
  currentEventTokens: {
    current: 3,
    max: 12,
    nextTokenInSeconds: 5400,
    regenDelayInSeconds: 7200,
  },
  hasUsedAdForExtraTokenToday: false,
  extraCurrencyPerPayout: null,
}

async function seed(entries: unknown[]) {
  await replacePlayerDataChunk("lre-progress", entries, {
    key: "lre-progress",
    hash: "lre-progress-h1",
    schemaVersion: 1,
    updatedAt: "2026-10-06T00:00:00Z",
  })
}

describe("Legendary Event progress queries", () => {
  beforeEach(async () => {
    await Dexie.delete(playerDataDbName)
  })

  it("reads a present event's entry and the whole chunk", async () => {
    await seed([lysanderProgress])

    expect(await getLegendaryEventProgress("astarLysander")).toEqual(
      lysanderProgress
    )
    expect(await getLegendaryEventsProgress()).toEqual([lysanderProgress])
  })

  it("returns undefined for an event the chunk has no entry for", async () => {
    await seed([lysanderProgress])

    expect(await getLegendaryEventProgress("votanUthar")).toBeUndefined()
  })

  it("reads a synced empty chunk as an empty list", async () => {
    await seed([])

    expect(await getLegendaryEventsProgress()).toEqual([])
    expect(await getLegendaryEventProgress("astarLysander")).toBeUndefined()
  })

  it("returns undefined for a chunk that has never synced", async () => {
    expect(await getLegendaryEventsProgress()).toBeUndefined()
  })
})
