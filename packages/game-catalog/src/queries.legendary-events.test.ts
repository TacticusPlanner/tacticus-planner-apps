import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import {
  catalogDbName,
  replaceGameCatalogDataset,
} from "./game-catalog-storage"
import {
  getLegendaryEvent,
  getLegendaryEvents,
  hasLegendaryEventsSynced,
} from "./queries"

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

// The storage layer stores records verbatim (validation happens at the API boundary), so these
// fixtures only carry the fields the assertions read.
const lysander = {
  id: "astarLysander",
  name: "Lysander",
  finished: false,
  eventStageStartDatesUtc: ["2026-08-30T00:00:00Z"],
}
const uthar = {
  id: "votanUthar",
  name: "Uthar",
  finished: false,
  eventStageStartDatesUtc: ["2026-10-04T00:00:00Z"],
}
describe("Legendary Event queries", () => {
  beforeEach(async () => {
    await Dexie.delete(catalogDbName)
  })

  it("lists every Legendary Event and finds one by id", async () => {
    await replaceGameCatalogDataset("lres", [lysander, uthar], metadata("lres"))

    const events = await getLegendaryEvents()
    expect(events.map((event) => event.id).sort()).toEqual([
      "astarLysander",
      "votanUthar",
    ])
    expect(await getLegendaryEvent("votanUthar")).toMatchObject(uthar)
    expect(await getLegendaryEvent("notAnEvent")).toBeUndefined()
    expect(await hasLegendaryEventsSynced()).toBe(true)
  })

  it("returns an empty list before the dataset syncs", async () => {
    expect(await getLegendaryEvents()).toEqual([])
    expect(await getLegendaryEvent("astarLysander")).toBeUndefined()
    expect(await hasLegendaryEventsSynced()).toBe(false)
  })
})
