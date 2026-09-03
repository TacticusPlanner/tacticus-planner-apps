import { describe, expect, it } from "vitest"

import {
  datasetToStorageModels,
  mapDatasetRowToStorageModel,
} from "./game-catalog.mapper"

describe("events-calendar flattening (byCalendarDate)", () => {
  const flatten = datasetToStorageModels["events-calendar"]

  it("flattens a date-indexed payload into one row per (date, entry) pair with date injected", () => {
    const payload = {
      "2026-07-26": [
        {
          occurrenceId: "occ-lucius",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-08-02T00:00:00Z",
          parameters: { featuredCharacterId: "lucius" },
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
    }

    const rows = flatten(payload)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      date: "2026-07-26",
      occurrenceId: "occ-lucius",
    })
    expect(rows[1]).toMatchObject({ date: "2026-09-06", occurrenceId: null })
  })

  it("gives confirmed occurrences and projected placeholders distinct ids sharing a date", () => {
    const payload = {
      "2026-07-26": [
        {
          occurrenceId: "occ-lucius",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-08-02T00:00:00Z",
          parameters: null,
        },
        {
          occurrenceId: null,
          definitionId: "always-double-xp-sunday",
          confirmed: false,
          startUtc: "2026-07-26T00:00:00Z",
          endUtc: "2026-07-27T00:00:00Z",
          parameters: null,
        },
      ],
    }

    const rows = flatten(payload).map(mapDatasetRowToStorageModel)
    const ids = rows.map((row) => row.id)

    expect(new Set(ids).size).toBe(2) // no id collision between the two entries on the same date
  })

  it("returns an empty array for non-object or missing data", () => {
    expect(flatten(undefined)).toEqual([])
    expect(flatten(null)).toEqual([])
    expect(flatten([])).toEqual([])
  })
})

describe("shops mapping (asArray passthrough)", () => {
  it("maps a shops payload to one row per shop, keyed by shop id", () => {
    const rows = datasetToStorageModels
      .shops([
        { id: "guild", slots: [] },
        { id: "rogue-trader", slots: [] },
      ])
      .map(mapDatasetRowToStorageModel)

    expect(rows.map((row) => row.id)).toEqual(["guild", "rogue-trader"])
  })
})
