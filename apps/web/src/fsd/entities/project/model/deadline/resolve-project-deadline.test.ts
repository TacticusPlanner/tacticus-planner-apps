import { describe, expect, it } from "vitest"

import { resolveProjectDeadline } from "./resolve-project-deadline"

const ms = (iso: string) => Date.parse(iso)
const target = (eventId: string, run?: 1 | 2 | 3) => ({
  kind: "legendaryEvent" as const,
  eventId,
  ...(run === undefined ? {} : { run }),
})

// Uthar: run 1 and run 2 announced; run 3 is estimated at least 140 days after run 2 and 315 after
// run 1, and no sooner than 35 days after the latest announced run in the catalog.
const uthar = {
  id: "votanUthar",
  eventStageStartDatesUtc: ["2026-03-08T00:00:00Z", "2026-10-04T00:00:00Z"],
}
const bile = {
  id: "lostaBile",
  eventStageStartDatesUtc: ["2026-11-08T00:00:00Z"],
}
const catalog = [uthar, bile]

describe("resolveProjectDeadline", () => {
  it("is loading while the catalog loads", () => {
    expect(
      resolveProjectDeadline(
        target("votanUthar"),
        null,
        ms("2026-11-03T22:00Z")
      )
    ).toEqual({ status: "loading" })
  })

  it("resolves a target without a run to the next run's start", () => {
    const next = {
      id: "votanUthar",
      eventStageStartDatesUtc: [
        "2026-03-08T00:00:00Z",
        "2026-10-04T00:00:00Z",
        "2026-11-27T00:00:00Z",
      ],
    }
    expect(
      resolveProjectDeadline(
        target("votanUthar"),
        [next],
        ms("2026-11-03T22:00Z")
      )
    ).toEqual({
      status: "ready",
      deadlineMs: ms("2026-11-27T00:00Z"),
      endMs: ms("2026-12-04T00:00Z"),
      run: 3,
      estimated: false,
      ended: false,
    })
  })

  it("uses the earliest estimate for an unannounced next run", () => {
    const deadline = resolveProjectDeadline(
      target("votanUthar"),
      catalog,
      ms("2026-11-03T22:00Z")
    )
    // Run 2 (2026-10-04) + 140 d = 2027-02-21, after run 1 + 315 d (2027-01-17) and Bile + 35 d.
    expect(deadline).toEqual({
      status: "ready",
      deadlineMs: ms("2027-02-21T00:00Z"),
      endMs: ms("2027-02-28T00:00Z"),
      run: 3,
      estimated: true,
      ended: false,
    })
  })

  it("resolves an announced named run, not estimated", () => {
    expect(
      resolveProjectDeadline(
        target("lostaBile", 1),
        catalog,
        ms("2026-11-03T22:00Z")
      )
    ).toEqual({
      status: "ready",
      deadlineMs: ms("2026-11-08T00:00Z"),
      endMs: ms("2026-11-15T00:00Z"),
      run: 1,
      estimated: false,
      ended: false,
    })
  })

  it("marks an unannounced named run estimated", () => {
    const deadline = resolveProjectDeadline(
      target("votanUthar", 3),
      catalog,
      ms("2026-11-03T22:00Z")
    )
    expect(deadline).toMatchObject({ status: "ready", run: 3, estimated: true })
  })

  it("is unavailable when the catalog does not serve the event", () => {
    expect(
      resolveProjectDeadline(target("gone"), catalog, ms("2026-11-03T22:00Z"))
    ).toEqual({ status: "unavailable" })
  })

  it("is unavailable when the run has no start", () => {
    const unannounced = { id: "newEvent", eventStageStartDatesUtc: [] }
    expect(
      resolveProjectDeadline(
        target("newEvent"),
        [unannounced],
        ms("2026-11-03T22:00Z")
      )
    ).toEqual({ status: "unavailable" })
  })

  it("ends a target without a run once run 3 has started", () => {
    const finished = {
      id: "votanUthar",
      eventStageStartDatesUtc: [
        "2026-03-08T00:00:00Z",
        "2026-10-04T00:00:00Z",
        "2026-11-02T00:00:00Z",
      ],
    }
    expect(
      resolveProjectDeadline(
        target("votanUthar"),
        [finished],
        ms("2026-11-03T22:00Z")
      )
    ).toEqual({
      status: "ready",
      deadlineMs: ms("2026-11-02T00:00Z"),
      endMs: ms("2026-11-09T00:00Z"),
      run: 3,
      estimated: false,
      ended: true,
    })
  })

  it("ends a named run at its start", () => {
    expect(
      resolveProjectDeadline(
        target("votanUthar", 2),
        catalog,
        ms("2026-11-03T22:00Z")
      )
    ).toMatchObject({ status: "ready", ended: true })
  })
})
