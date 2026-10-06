import { describe, expect, it } from "vitest"

import {
  deriveLegendaryEventLifecycle,
  LEGENDARY_EVENT_RUN_DURATION_MS,
  orderLegendaryEventsForHub,
} from "./lifecycle"

const at = (iso: string) => Date.parse(iso)
const event = (
  name: string,
  starts: string[],
  finished = false
): { name: string; finished: boolean; eventStageStartDatesUtc: string[] } => ({
  name,
  finished,
  eventStageStartDatesUtc: starts,
})

const lysander = event("Lysander", ["2026-08-30T00:00:00Z"])
const uthar = event("Uthar", ["2026-10-04T00:00:00Z"])

describe("deriveLegendaryEventLifecycle", () => {
  it("is active inside the 7-day run window", () => {
    expect(
      deriveLegendaryEventLifecycle(lysander, at("2026-09-02T12:00:00Z"))
    ).toEqual({
      state: "active",
      runStartMs: at("2026-08-30T00:00:00Z"),
      runEndMs: at("2026-09-06T00:00:00Z"),
    })
  })

  it("is active at the start instant and not at start + 7 days", () => {
    expect(
      deriveLegendaryEventLifecycle(lysander, at("2026-08-30T00:00:00Z")).state
    ).toBe("active")
    expect(
      deriveLegendaryEventLifecycle(lysander, at("2026-09-06T00:00:00Z")).state
    ).not.toBe("active")
    expect(LEGENDARY_EVENT_RUN_DURATION_MS).toBe(7 * 86_400_000)
  })

  it("is upcoming with the earliest future run start", () => {
    expect(
      deriveLegendaryEventLifecycle(uthar, at("2026-09-20T00:00:00Z"))
    ).toMatchObject({
      state: "upcoming",
      runStartMs: at("2026-10-04T00:00:00Z"),
    })
    const unsorted = event("Multi", [
      "2026-12-01T00:00:00Z",
      "2026-11-01T00:00:00Z",
    ])
    expect(
      deriveLegendaryEventLifecycle(unsorted, at("2026-10-01T00:00:00Z"))
        .runStartMs
    ).toBe(at("2026-11-01T00:00:00Z"))
  })

  it("is archived when finished", () => {
    const finished = event("Done", ["2026-11-01T00:00:00Z"], true)
    expect(
      deriveLegendaryEventLifecycle(finished, at("2026-10-06T00:00:00Z"))
    ).toEqual({ state: "archived" })
  })

  it("is upcoming with no window (TBA) when unfinished and no run is in the future", () => {
    const tba = { name: "Tba", finished: false, eventStageStartDatesUtc: [] }
    expect(
      deriveLegendaryEventLifecycle(tba, at("2026-10-06T00:00:00Z"))
    ).toEqual({ state: "upcoming" })
    const expired = event("Old", ["2026-05-17T00:00:00Z"])
    expect(
      deriveLegendaryEventLifecycle(expired, at("2026-10-06T00:00:00Z"))
    ).toEqual({ state: "upcoming" })
  })

  it("treats unparseable run starts as TBA", () => {
    const broken = event("Broken", ["not-a-date"])
    expect(
      deriveLegendaryEventLifecycle(broken, at("2026-10-06T00:00:00Z")).state
    ).toBe("upcoming")
  })
})

describe("orderLegendaryEventsForHub", () => {
  it("groups active, upcoming by start (TBA last), then archived by name", () => {
    const farsight = event("Farsight", ["2026-10-18T00:00:00Z"])
    const dante = event("Dante", []) // TBA
    const zed = event("Zed", []) // TBA, sorts after Dante by name
    const abaddon = event("Abaddon", ["2026-02-01T00:00:00Z"], true)
    const groups = orderLegendaryEventsForHub(
      [zed, dante, farsight, uthar, abaddon, lysander],
      at("2026-09-02T12:00:00Z"),
      (entry) => entry.name
    )

    expect(groups.active.map((entry) => entry.event.name)).toEqual(["Lysander"])
    expect(groups.upcoming.map((entry) => entry.event.name)).toEqual([
      "Uthar",
      "Farsight",
      "Dante",
      "Zed",
    ])
    expect(groups.archived.map((entry) => entry.event.name)).toEqual([
      "Abaddon",
    ])
  })
})
