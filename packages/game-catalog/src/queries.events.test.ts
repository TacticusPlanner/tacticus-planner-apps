import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import {
  catalogDbName,
  replaceGameCatalogDataset,
} from "./game-catalog-storage"
import {
  getEventDefinitions,
  getEventDefinitionsMap,
  getEventsActiveAt,
  getUpcomingEvents,
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

async function seedEventsCalendar(payload: Record<string, unknown[]>) {
  await replaceGameCatalogDataset(
    "events-calendar",
    payload,
    metadata("events-calendar")
  )
}

describe("event queries", () => {
  beforeEach(async () => {
    await resetDb()
  })

  it("getEventDefinitions/getEventDefinitionsMap round-trip", async () => {
    await replaceGameCatalogDataset(
      "event-definitions",
      [
        {
          id: "hse-faction-boost",
          type: "HomeScreenEvent",
          recurrence: { kind: "None" },
          requiredParameters: ["targetFactionId"],
        },
        {
          id: "hse-faction-focus",
          type: "HomeScreenEvent",
          recurrence: { kind: "None" },
          requiredParameters: [],
        },
      ],
      metadata("event-definitions")
    )

    const definitions = await getEventDefinitions()
    expect(definitions).toHaveLength(2)

    const byId = await getEventDefinitionsMap()
    expect(byId.get("hse-faction-boost")?.requiredParameters).toEqual([
      "targetFactionId",
    ])
  })

  it("getEventsActiveAt returns only entries whose window contains the instant (start inclusive, end exclusive)", async () => {
    await seedEventsCalendar({
      "2026-07-26": [
        {
          occurrenceId: "occ-lucius",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-08-02T00:00:00Z",
          parameters: null,
        },
      ],
      "2026-09-06": [
        {
          occurrenceId: null,
          definitionId: "legendary-event",
          confirmed: false,
          startUtc: "2026-09-06T00:00:00Z",
          endUtc: "2026-09-13T00:00:00Z",
          parameters: null,
        },
      ],
    })

    const duringLucius = await getEventsActiveAt(
      new Date("2026-07-28T00:00:00Z")
    )
    expect(duringLucius).toHaveLength(1)
    expect(duringLucius[0]?.occurrenceId).toBe("occ-lucius")

    const atExactStart = await getEventsActiveAt(
      new Date("2026-07-26T00:00:00Z")
    )
    expect(atExactStart).toHaveLength(1) // start is inclusive

    const atExactEnd = await getEventsActiveAt(new Date("2026-08-02T00:00:00Z"))
    expect(atExactEnd).toHaveLength(0) // end is exclusive

    const betweenEvents = await getEventsActiveAt(
      new Date("2026-08-15T00:00:00Z")
    )
    expect(betweenEvents).toHaveLength(0)
  })

  it("getEventsActiveAt dedupes a multi-day entry that spans several stored date-rows", async () => {
    await seedEventsCalendar({
      "2026-07-26": [
        {
          occurrenceId: "occ-lucius",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-08-02T00:00:00Z",
          parameters: null,
        },
      ],
      "2026-07-27": [
        {
          occurrenceId: "occ-lucius",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-08-02T00:00:00Z",
          parameters: null,
        },
      ],
      "2026-07-28": [
        {
          occurrenceId: "occ-lucius",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-08-02T00:00:00Z",
          parameters: null,
        },
      ],
    })

    const active = await getEventsActiveAt(new Date("2026-07-27T12:00:00Z"))
    expect(active).toHaveLength(1) // one entry, not one per stored date-row
  })

  it("getUpcomingEvents returns entries overlapping the given range, deduped", async () => {
    await seedEventsCalendar({
      "2026-07-26": [
        {
          occurrenceId: "occ-lucius",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-08-02T00:00:00Z",
          parameters: null,
        },
      ],
      "2026-07-27": [
        {
          occurrenceId: "occ-lucius",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-08-02T00:00:00Z",
          parameters: null,
        },
      ],
      "2026-09-06": [
        {
          occurrenceId: null,
          definitionId: "legendary-event",
          confirmed: false,
          startUtc: "2026-09-06T00:00:00Z",
          endUtc: "2026-09-13T00:00:00Z",
          parameters: null,
        },
      ],
    })

    const upcoming = await getUpcomingEvents(
      new Date("2026-07-01T00:00:00Z"),
      new Date("2026-08-15T00:00:00Z")
    )
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0]?.occurrenceId).toBe("occ-lucius")

    const later = await getUpcomingEvents(
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-09-20T00:00:00Z")
    )
    expect(later).toHaveLength(1)
    expect(later[0]?.confirmed).toBe(false)
  })
})
