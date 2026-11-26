import { describe, expect, it } from "vitest"

import {
  compareSurvivalEvents,
  defaultSurvivalEventId,
  survivalEventStatus,
} from "./survival-event-status"

const may = {
  id: "may-2026",
  startUtc: "2026-05-24T00:00:00+00:00",
  endUtc: "2026-05-31T00:00:00+00:00",
}
const september = {
  id: "september-2026",
  startUtc: "2026-09-12T00:00:00+00:00",
  endUtc: "2026-09-19T00:00:00+00:00",
}
const december = {
  id: "december-2026",
  startUtc: "2026-12-03T00:00:00+00:00",
  endUtc: "2026-12-10T00:00:00+00:00",
}
const crescendo = { id: "crescendo-a", startUtc: null, endUtc: null }
const events = [crescendo, december, may, september]

describe("survivalEventStatus", () => {
  it("is running from the start up to the exclusive end", () => {
    expect(survivalEventStatus(december, Date.parse(december.startUtc))).toBe(
      "running"
    )
    expect(survivalEventStatus(december, Date.parse(december.endUtc))).toBe(
      "past"
    )
    expect(survivalEventStatus(december, Date.parse("2026-11-26"))).toBe(
      "upcoming"
    )
    expect(survivalEventStatus(crescendo, 0)).toBe("undated")
  })
})

describe("compareSurvivalEvents", () => {
  it("orders dated events by start and undated ones last", () => {
    expect(events.toSorted(compareSurvivalEvents).map((e) => e.id)).toEqual([
      "may-2026",
      "september-2026",
      "december-2026",
      "crescendo-a",
    ])
  })
})

describe("defaultSurvivalEventId", () => {
  it("opens the running event", () => {
    expect(
      defaultSurvivalEventId(events, Date.parse("2026-09-13T12:00:00Z"))
    ).toBe("september-2026")
  })

  it("opens the next event when none runs", () => {
    expect(defaultSurvivalEventId(events, Date.parse("2026-11-26"))).toBe(
      "december-2026"
    )
  })

  it("opens the newest past event once every dated one ended", () => {
    expect(defaultSurvivalEventId(events, Date.parse("2027-01-01"))).toBe(
      "december-2026"
    )
  })

  it("opens an undated event when no event is dated, and none for no events", () => {
    expect(defaultSurvivalEventId([crescendo], 0)).toBe("crescendo-a")
    expect(defaultSurvivalEventId([], 0)).toBeNull()
  })
})
