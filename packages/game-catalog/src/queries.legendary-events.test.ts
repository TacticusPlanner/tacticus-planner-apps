import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import {
  catalogDbName,
  replaceGameCatalogDataset,
} from "./game-catalog-storage"
import {
  getLegendaryEvent,
  getLegendaryEventBattles,
  getLegendaryEventsBattles,
  getHordeModeTiers,
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
  eventStageStartDatesUtc: ["2026-08-30T00:00:00Z"],
}
const uthar = {
  id: "votanUthar",
  name: "Uthar",
  // Index = run − 1: run 1 started 2026-03-08, run 2 2026-10-04.
  eventStageStartDatesUtc: ["2026-03-08T00:00:00Z", "2026-10-04T00:00:00Z"],
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

  it("returns one event's battles across its lanes", async () => {
    await replaceGameCatalogDataset(
      "lre-battles",
      [
        { id: "votanUthar-alpha-1", lreId: "votanUthar", power: 1018 },
        { id: "votanUthar-beta-1", lreId: "votanUthar", power: 1200 },
        { id: "astarLysander-alpha-1", lreId: "astarLysander", power: 900 },
      ],
      metadata("lre-battles")
    )

    const battles = await getLegendaryEventBattles("votanUthar")
    expect(battles.map((battle) => battle.id).sort()).toEqual([
      "votanUthar-alpha-1",
      "votanUthar-beta-1",
    ])
  })

  it("returns several events' battles grouped by event from one read", async () => {
    await replaceGameCatalogDataset(
      "lre-battles",
      [
        { id: "votanUthar-alpha-1", lreId: "votanUthar", power: 1018 },
        { id: "votanUthar-beta-1", lreId: "votanUthar", power: 1200 },
        { id: "astarLysander-alpha-1", lreId: "astarLysander", power: 900 },
        { id: "tauFarsight-alpha-1", lreId: "tauFarsight", power: 700 },
      ],
      metadata("lre-battles")
    )

    const battles = await getLegendaryEventsBattles([
      "votanUthar",
      "astarLysander",
      "notAnEvent",
    ])
    expect(Object.keys(battles)).toEqual([
      "votanUthar",
      "astarLysander",
      "notAnEvent",
    ])
    expect(battles.votanUthar?.map((battle) => battle.id).sort()).toEqual([
      "votanUthar-alpha-1",
      "votanUthar-beta-1",
    ])
    expect(battles.astarLysander?.map((battle) => battle.id)).toEqual([
      "astarLysander-alpha-1",
    ])
    expect(battles.notAnEvent).toEqual([])
    expect(await getLegendaryEventsBattles([])).toEqual({})
  })

  it("returns the horde-mode tier list, or null when the dataset is absent", async () => {
    expect(await getHordeModeTiers()).toBeNull()

    const record = {
      id: "horde-mode-tiers",
      tiers: [{ tier: "S", multiplier: 1.3 }],
      characters: [{ unitId: "ultraCalgar", tier: "S" }],
    }
    await replaceGameCatalogDataset(
      "horde-mode-tiers",
      [record],
      metadata("horde-mode-tiers")
    )

    expect(await getHordeModeTiers()).toMatchObject(record)
  })
})
