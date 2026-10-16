import { describe, expect, it } from "vitest"

import {
  deriveLegendaryEventLifecycle,
  isLegendaryEventFinished,
  LEGENDARY_EVENT_RUN_DURATION_MS,
  orderLegendaryEventsForHub,
} from "./lifecycle"

const at = (iso: string) => Date.parse(iso)
const event = (
  name: string,
  starts: string[]
): { name: string; eventStageStartDatesUtc: string[] } => ({
  name,
  eventStageStartDatesUtc: starts,
})

/** Three runs, the last starting 2026-02-01 (over by 2026-02-08). */
const THREE_RUNS = [
  "2025-06-01T00:00:00Z",
  "2025-10-05T00:00:00Z",
  "2026-02-01T00:00:00Z",
]

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

  it("is archived once run 3's window has passed", () => {
    const done = event("Done", THREE_RUNS)
    expect(
      deriveLegendaryEventLifecycle(done, at("2026-10-06T00:00:00Z"))
    ).toEqual({ state: "archived" })
    expect(
      deriveLegendaryEventLifecycle(done, at("2026-02-07T23:59:59Z")).state
    ).toBe("active")
    expect(
      deriveLegendaryEventLifecycle(done, at("2026-02-08T00:00:00Z")).state
    ).toBe("archived")
  })

  it("is upcoming with no window (TBA) when unfinished and no run is in the future", () => {
    const tba = { name: "Tba", eventStageStartDatesUtc: [] }
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

describe("isLegendaryEventFinished", () => {
  const after = at("2026-10-06T00:00:00Z")

  it("is finished at run 3's start + 7 days, not before", () => {
    const done = event("Done", THREE_RUNS)
    expect(isLegendaryEventFinished(done, at("2026-02-07T23:59:59Z"))).toBe(
      false
    )
    expect(isLegendaryEventFinished(done, at("2026-02-08T00:00:00Z"))).toBe(
      true
    )
  })

  it("is not finished while fewer than three runs are announced", () => {
    expect(isLegendaryEventFinished(event("Tba", []), after)).toBe(false)
    expect(
      isLegendaryEventFinished(event("Two", THREE_RUNS.slice(0, 2)), after)
    ).toBe(false)
  })

  it("is not finished when a run start is unparseable", () => {
    expect(
      isLegendaryEventFinished(
        event("Broken", [
          "2025-06-01T00:00:00Z",
          "soon",
          "2026-02-01T00:00:00Z",
        ]),
        after
      )
    ).toBe(false)
  })
})

describe("orderLegendaryEventsForHub", () => {
  it("groups active, upcoming by start (TBA last), then archived by name", () => {
    const farsight = event("Farsight", ["2026-10-18T00:00:00Z"])
    const dante = event("Dante", []) // TBA
    const zed = event("Zed", []) // TBA, sorts after Dante by name
    const abaddon = event("Abaddon", THREE_RUNS)
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
